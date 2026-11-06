import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, finalize, map, of, shareReplay, tap, throwError } from 'rxjs';
import { ToastService } from '@artis/toaster';
import { ART_API_CONFIG, SKIP_AUTH, SKIP_ERROR_TOAST, TokenPair } from '../api.config';
import { ART_TOKEN_STORAGE, TokenStorage, createTokenStorage } from './token-storage';

export type SessionStatus = 'anonymous' | 'authenticated' | 'expired';

/** Décode la charge utile d'un JWT (sans vérifier la signature — c'est le rôle du serveur). */
export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const part = token.split('.')[1];
    if (!part) return null;
    const json = decodeURIComponent(
      atob(part.replace(/-/g, '+').replace(/_/g, '/'))
        .split('')
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join(''),
    );
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** Mapping par défaut des réponses d'authentification courantes. */
export function defaultMapAuthResponse(body: unknown): TokenPair {
  const b = (body ?? {}) as Record<string, unknown>;
  const src = typeof b['data'] === 'object' && b['data'] ? (b['data'] as Record<string, unknown>) : b;
  const accessToken = (src['accessToken'] ?? src['access_token'] ?? src['token'] ?? src['jwt']) as string | undefined;
  if (!accessToken) throw new Error('Réponse d’authentification sans jeton d’accès.');
  const refreshToken = (src['refreshToken'] ?? src['refresh_token']) as string | undefined;
  const expiresIn = Number(src['expiresIn'] ?? src['expires_in']);
  const jwtExp = Number(decodeJwtPayload(accessToken)?.['exp']);
  const expiresAt =
    Number.isFinite(expiresIn) && expiresIn > 0
      ? Date.now() + expiresIn * 1000
      : Number.isFinite(jwtExp) && jwtExp > 0 ? jwtExp * 1000 : undefined;
  return { accessToken, refreshToken, expiresAt };
}

/**
 * Gestion de session : login, logout, refresh (single-flight), expiration.
 * Les jetons ne sont jamais écrits dans les logs.
 */
@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly cfg = inject(ART_API_CONFIG);
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly store: TokenStorage =
    inject(ART_TOKEN_STORAGE, { optional: true }) ?? createTokenStorage(this.cfg.storage);

  private readonly kAccess = `${this.cfg.storagePrefix}.access`;
  private readonly kRefresh = `${this.cfg.storagePrefix}.refresh`;
  private readonly kExpires = `${this.cfg.storagePrefix}.expires`;

  private readonly _status = signal<SessionStatus>('anonymous');
  private readonly _user = signal<unknown | null>(null);
  private refreshInFlight$: Observable<string> | null = null;

  readonly status = this._status.asReadonly();
  readonly isAuthenticated = computed(() => this._status() === 'authenticated');
  /** Utilisateur courant (claims du JWT par défaut, ou profil fourni via `setUser`). */
  readonly user = this._user.asReadonly();

  constructor() {
    this.restore();
  }

  get accessToken(): string | null { return this.store.get(this.kAccess); }
  get refreshToken(): string | null { return this.store.get(this.kRefresh); }
  get expiresAt(): number | null {
    const v = this.store.get(this.kExpires);
    return v ? Number(v) : null;
  }

  /** Vrai si le jeton est expiré ou expire dans `skewSeconds`. */
  isTokenExpired(skewSeconds = 0): boolean {
    const exp = this.expiresAt;
    return exp !== null && exp - skewSeconds * 1000 <= Date.now();
  }

  /** Connexion : POST des identifiants vers `authEndpoints.login`. */
  login(credentials: Record<string, unknown>): Observable<TokenPair> {
    return this.http
      .post<unknown>(this.url(this.cfg.authEndpoints.login), credentials, {
        context: new HttpContext().set(SKIP_AUTH, true),
        withCredentials: this.cfg.withCredentials,
      })
      .pipe(
        map((body) => (this.cfg.mapAuthResponse ?? defaultMapAuthResponse)(body)),
        tap((pair) => this.setTokens(pair)),
      );
  }

  /** Enregistre des jetons obtenus autrement (SSO, callback OAuth…). */
  setTokens(pair: TokenPair): void {
    this.store.set(this.kAccess, pair.accessToken);
    if (pair.refreshToken) this.store.set(this.kRefresh, pair.refreshToken); else this.store.remove(this.kRefresh);
    // Expiration explicite, sinon déduite de la claim `exp` du JWT (cas SSO / jetons posés directement).
    const jwtExp = Number(decodeJwtPayload(pair.accessToken)?.['exp']);
    const expiresAt = pair.expiresAt ?? (Number.isFinite(jwtExp) && jwtExp > 0 ? jwtExp * 1000 : undefined);
    if (expiresAt) this.store.set(this.kExpires, String(expiresAt)); else this.store.remove(this.kExpires);
    this._user.set(decodeJwtPayload(pair.accessToken));
    this._status.set('authenticated');
  }

  setUser(user: unknown): void { this._user.set(user); }

  /** Rafraîchit le jeton. Les appels concurrents partagent une seule requête. */
  refresh(): Observable<string> {
    if (this.refreshInFlight$) return this.refreshInFlight$;
    const rt = this.refreshToken;
    if (!rt && !this.cfg.withCredentials) {
      return throwError(() => new Error('Aucun refresh token disponible.'));
    }
    this.refreshInFlight$ = this.http
      .post<unknown>(
        this.url(this.cfg.authEndpoints.refresh),
        rt ? { refreshToken: rt, refresh_token: rt } : {},
        {
          context: new HttpContext().set(SKIP_AUTH, true).set(SKIP_ERROR_TOAST, true),
          withCredentials: this.cfg.withCredentials,
        },
      )
      .pipe(
        map((body) => (this.cfg.mapAuthResponse ?? defaultMapAuthResponse)(body)),
        tap((pair) => this.setTokens({ ...pair, refreshToken: pair.refreshToken ?? rt ?? undefined })),
        map((pair) => pair.accessToken),
        finalize(() => (this.refreshInFlight$ = null)),
        shareReplay({ bufferSize: 1, refCount: false }),
      );
    return this.refreshInFlight$;
  }

  /** Retourne un jeton valide, en rafraîchissant s'il est (presque) expiré ; `null` si impossible. */
  ensureValidToken(): Observable<string | null> {
    const token = this.accessToken;
    if (!token) return of(null);
    if (!this.isTokenExpired(this.cfg.refreshSkewSeconds)) return of(token);
    if (!this.refreshToken && !this.cfg.withCredentials) return of(this.isTokenExpired() ? null : token);
    return this.refresh().pipe(catchError(() => of(null)));
  }

  /** Déconnexion : prévient le serveur (best-effort), vide les jetons, redirige vers le login. */
  logout(options: { redirect?: boolean; notifyServer?: boolean } = {}): void {
    const { redirect = true, notifyServer = true } = options;
    const endpoint = this.cfg.authEndpoints.logout;
    if (notifyServer && endpoint && this.accessToken) {
      this.http
        .post(this.url(endpoint), {}, {
          withCredentials: this.cfg.withCredentials,
          context: new HttpContext().set(SKIP_ERROR_TOAST, true),
        })
        .pipe(catchError(() => of(null)))
        .subscribe();
    }
    this.clear('anonymous');
    if (redirect) void this.router.navigate([this.cfg.loginRoute]);
  }

  /** Session expirée (401 non récupérable) : informe l'utilisateur et redirige. */
  expire(returnUrl?: string): void {
    if (this._status() === 'expired') return;
    this.clear('expired');
    this.toast.warning({ id: 'art-session-expired', message: 'Votre session a expiré. Veuillez vous reconnecter.' });
    void this.router.navigate([this.cfg.loginRoute], returnUrl ? { queryParams: { returnUrl } } : undefined);
  }

  /** Vide la session sans toast ni navigation (utilisé par les guards). */
  invalidate(status: SessionStatus = 'expired'): void { this.clear(status); }

  /** Redirige vers le login sans message (utilisateur jamais connecté). */
  redirectToLogin(returnUrl?: string): void {
    void this.router.navigate([this.cfg.loginRoute], returnUrl ? { queryParams: { returnUrl } } : undefined);
  }

  private clear(status: SessionStatus): void {
    this.store.remove(this.kAccess);
    this.store.remove(this.kRefresh);
    this.store.remove(this.kExpires);
    this._user.set(null);
    this._status.set(status);
  }

  private restore(): void {
    const token = this.accessToken;
    if (!token) return;
    if (this.isTokenExpired() && !this.refreshToken && !this.cfg.withCredentials) {
      this.clear('expired');
      return;
    }
    this._user.set(decodeJwtPayload(token));
    this._status.set('authenticated');
  }

  private url(path: string): string {
    return /^https?:\/\//.test(path) ? path : `${this.cfg.baseUrl}${path}`;
  }
}
