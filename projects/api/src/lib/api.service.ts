import { HttpClient, HttpContext, HttpEventType, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, Subject, defer, filter, firstValueFrom, map, takeUntil } from 'rxjs';
import { ART_API_CONFIG, SKIP_AUTH, SKIP_ERROR_TOAST, SKIP_LOADER } from './api.config';
import { ListQuery, Page, RequestOptions, UploadEvent } from './api.models';
import { buildListParams, defaultMapPage } from './list-params';

export interface UploadOptions extends RequestOptions {
  /** Nom du champ multipart contenant le fichier. Défaut : `file`. */
  fieldName?: string;
  /** Champs multipart additionnels. */
  fields?: Record<string, string>;
}

function fromAbort(signal: AbortSignal): Observable<void> {
  return new Observable<void>((sub) => {
    if (signal.aborted) { sub.next(); sub.complete(); return; }
    const h = () => { sub.next(); sub.complete(); };
    signal.addEventListener('abort', h, { once: true });
    return () => signal.removeEventListener('abort', h);
  });
}

/**
 * Client API générique. Les erreurs sortent sous forme d'`ApiError` (voir errorInterceptor) ;
 * l'auth, le tracing, le loader et les toasts sont gérés par les intercepteurs.
 *
 * Annulation : `signal` (AbortController) ou `cancelKey` (un nouvel appel annule le précédent de même clé) ;
 * se désabonner suffit aussi. Une requête annulée se termine sans erreur ni valeur.
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly cfg = inject(ART_API_CONFIG);
  private readonly cancel$ = new Subject<string>();
  private readonly cancelAll$ = new Subject<void>();

  get<T>(path: string, opts: RequestOptions = {}): Observable<T> {
    return this.wrap(opts, () => this.http.get<T>(this.buildUrl(path), this.ho(opts)));
  }
  post<T>(path: string, body?: unknown, opts: RequestOptions = {}): Observable<T> {
    return this.wrap(opts, () => this.http.post<T>(this.buildUrl(path), body ?? null, this.ho(opts)));
  }
  put<T>(path: string, body?: unknown, opts: RequestOptions = {}): Observable<T> {
    return this.wrap(opts, () => this.http.put<T>(this.buildUrl(path), body ?? null, this.ho(opts)));
  }
  patch<T>(path: string, body?: unknown, opts: RequestOptions = {}): Observable<T> {
    return this.wrap(opts, () => this.http.patch<T>(this.buildUrl(path), body ?? null, this.ho(opts)));
  }
  delete<T>(path: string, opts: RequestOptions = {}): Observable<T> {
    return this.wrap(opts, () => this.http.delete<T>(this.buildUrl(path), this.ho(opts)));
  }

  /** Liste paginée / triée / filtrée selon `ArtApiConfig.listContract`. */
  list<T>(path: string, query: ListQuery = {}, opts: RequestOptions = {}): Observable<Page<T>> {
    const contract = this.cfg.listContract;
    const params = { ...buildListParams(query, contract), ...(opts.params ?? {}) };
    return this.get<unknown>(path, { ...opts, params }).pipe(
      map((body) => (contract.mapPage ?? defaultMapPage)<T>(body, query)),
    );
  }

  /**
   * Téléverse un fichier en multipart avec progression.
   * Émet `{type:'progress', percent}` puis `{type:'done', body}`.
   */
  upload<T = unknown>(path: string, file: File | Blob, opts: UploadOptions = {}): Observable<UploadEvent<T>> {
    const form = new FormData();
    const name = file instanceof File ? file.name : 'blob';
    form.append(opts.fieldName ?? 'file', file, name);
    for (const [k, v] of Object.entries(opts.fields ?? {})) form.append(k, v);

    return this.wrap(opts, () =>
      this.http
        .post<T>(this.buildUrl(path), form, { ...this.ho(opts), observe: 'events', reportProgress: true })
        .pipe(
          map((e): UploadEvent<T> | null => {
            if (e.type === HttpEventType.UploadProgress) {
              const total = e.total;
              return { type: 'progress', loaded: e.loaded, total, percent: total ? Math.round((e.loaded / total) * 100) : 0 };
            }
            if (e.type === HttpEventType.Response) return { type: 'done', body: e.body as T };
            return null;
          }),
          filter((e): e is UploadEvent<T> => e !== null),
        ),
    );
  }

  /** Annule les requêtes en cours portant cette `cancelKey`. */
  cancel(key: string): void { this.cancel$.next(key); }
  /** Annule toutes les requêtes annulables en cours. */
  cancelAll(): void { this.cancelAll$.next(); }

  /** Variantes Promise (migration depuis `art-ui-generative`). */
  getAsync<T>(path: string, opts?: RequestOptions): Promise<T> { return firstValueFrom(this.get<T>(path, opts)); }
  postAsync<T>(path: string, body?: unknown, opts?: RequestOptions): Promise<T> { return firstValueFrom(this.post<T>(path, body, opts)); }
  putAsync<T>(path: string, body?: unknown, opts?: RequestOptions): Promise<T> { return firstValueFrom(this.put<T>(path, body, opts)); }
  patchAsync<T>(path: string, body?: unknown, opts?: RequestOptions): Promise<T> { return firstValueFrom(this.patch<T>(path, body, opts)); }
  deleteAsync<T>(path: string, opts?: RequestOptions): Promise<T> { return firstValueFrom(this.delete<T>(path, opts)); }

  /**
   * Préfixe `baseUrl` aux chemins relatifs ; laisse passer les URL absolues.
   * Garde-fou : un chemin qui commence DÉJÀ par `baseUrl` (ex. baseUrl `/api` et chemin `/api/upload`) n'est pas préfixé deux fois.
   */
  buildUrl(path: string): string {
    if (/^https?:\/\//i.test(path)) return path;
    const base = this.cfg.baseUrl;
    if (base && (path === base || path.startsWith(base + '/'))) return path;
    return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
  }

  private ho(opts: RequestOptions) {
    let context = new HttpContext();
    if (opts.skipLoader) context = context.set(SKIP_LOADER, true);
    if (opts.skipAuth) context = context.set(SKIP_AUTH, true);
    if (opts.skipErrorToast) context = context.set(SKIP_ERROR_TOAST, true);
    return {
      params: this.toParams(opts.params),
      headers: opts.headers,
      context,
      withCredentials: this.cfg.withCredentials,
    };
  }

  private toParams(obj?: Record<string, unknown>): HttpParams {
    let p = new HttpParams();
    for (const [k, v] of Object.entries(obj ?? {})) {
      const values = Array.isArray(v) ? v : [v];
      for (const x of values) {
        if (x === null || x === undefined || x === '') continue;
        p = p.append(k, x instanceof Date ? x.toISOString() : String(x));
      }
    }
    return p;
  }

  private wrap<T>(opts: RequestOptions, factory: () => Observable<T>): Observable<T> {
    return defer(() => {
      const key = opts.cancelKey;
      if (key) this.cancel$.next(key); // annule la requête précédente de même clé
      let obs = factory().pipe(takeUntil(this.cancelAll$));
      if (key) obs = obs.pipe(takeUntil(this.cancel$.pipe(filter((k) => k === key))));
      if (opts.signal) obs = obs.pipe(takeUntil(fromAbort(opts.signal)));
      return obs;
    });
  }
}
