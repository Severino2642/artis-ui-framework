import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { ART_API_CONFIG, SKIP_AUTH } from '../api.config';
import { SessionService } from '../session/session.service';
import { isApiRequest } from './utils';

/**
 * - Joint `Authorization: Bearer …` aux requêtes vers le backend (jamais vers un tiers).
 * - Rafraîchit proactivement un jeton proche de l'expiration.
 * - Sur 401 : tente UN refresh puis rejoue la requête ; si impossible → session expirée + redirection login.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const cfg = inject(ART_API_CONFIG);
  if (req.context.get(SKIP_AUTH) || !isApiRequest(req, cfg)) return next(req);

  const session = inject(SessionService);
  const router = inject(Router);

  const withToken = (r: HttpRequest<unknown>, token: string | null) =>
    token ? r.clone({ setHeaders: { [cfg.tokenHeader]: `${cfg.tokenPrefix} ${token}`.trim() } }) : r;

  const onUnauthorized = (original: HttpErrorResponse) => {
    const wasLoggedIn = session.status() !== 'anonymous';
    if (wasLoggedIn) session.expire(router.url);
    else session.redirectToLogin(router.url);
    return throwError(() => original);
  };

  return session.ensureValidToken().pipe(
    switchMap((token) => next(withToken(req, token))),
    catchError((err: unknown) => {
      if (!(err instanceof HttpErrorResponse) || err.status !== 401) return throwError(() => err);
      if (session.refreshToken || cfg.withCredentials) {
        return session.refresh().pipe(
          switchMap((token) => next(withToken(req, token))),
          catchError(() => onUnauthorized(err)),
        );
      }
      return onUnauthorized(err);
    }),
  );
};
