import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { ART_API_CONFIG } from '../api.config';
import { SessionService, decodeJwtPayload } from '../session/session.service';

/** Autorise la route si la session est valide (rafraîchit le jeton si besoin), sinon redirige vers le login avec `returnUrl`. */
export const authGuard: CanActivateFn = (_route, state) => {
  const session = inject(SessionService);
  const router = inject(Router);
  const cfg = inject(ART_API_CONFIG);
  const toLogin = () => router.createUrlTree([cfg.loginRoute], { queryParams: { returnUrl: state.url } });

  if (!session.accessToken) return toLogin();
  return session.ensureValidToken().pipe(
    map((token) => {
      if (token) return true;
      session.invalidate('expired');
      return toLogin();
    }),
  );
};

/** Pour les pages publiques (login, register) : redirige vers l'accueil si déjà connecté. */
export const guestGuard: CanActivateFn = () => {
  const session = inject(SessionService);
  const router = inject(Router);
  const cfg = inject(ART_API_CONFIG);
  return session.isAuthenticated() && !session.isTokenExpired() ? router.createUrlTree([cfg.homeRoute]) : true;
};

/**
 * Garde par rôle : `canActivate: [authGuard, roleGuard(['admin'])]`.
 * Lit la claim `roles` (ou `claim`) du jeton ; refuse sinon vers `forbiddenRoute`.
 */
export function roleGuard(roles: string[], options: { claim?: string; forbiddenRoute?: string } = {}): CanActivateFn {
  return () => {
    const session = inject(SessionService);
    const router = inject(Router);
    const claims = (session.user() as Record<string, unknown> | null) ?? decodeJwtPayload(session.accessToken ?? '') ?? {};
    const raw = claims[options.claim ?? 'roles'];
    const owned = Array.isArray(raw) ? raw.map(String) : typeof raw === 'string' ? raw.split(/[ ,]+/) : [];
    return roles.some((r) => owned.includes(r)) ? true : router.createUrlTree([options.forbiddenRoute ?? '/forbidden']);
  };
}
