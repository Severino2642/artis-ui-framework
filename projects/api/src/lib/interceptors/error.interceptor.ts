import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '@artis/toaster';
import { ART_API_CONFIG, SKIP_AUTH, SKIP_ERROR_TOAST } from '../api.config';
import { ApiError } from '../errors/api-error';
import { normalizeHttpError } from '../errors/normalize-error';

/**
 * Convertit toute erreur HTTP en `ApiError` et affiche le toast correspondant.
 * Les composants reçoivent un `ApiError` (jamais un `HttpErrorResponse` brut) et n'ont rien à afficher eux-mêmes.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const cfg = inject(ART_API_CONFIG);
  const toast = inject(ToastService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((err: unknown) => {
      if (!(err instanceof HttpErrorResponse) && !(err instanceof ApiError)) return throwError(() => err);
      const isAuthRequest = req.context.get(SKIP_AUTH);
      const apiError = normalizeHttpError(err, cfg, { isAuthRequest });
      cfg.onError?.(apiError);

      // Les 401 « session » sont déjà notifiés par SessionService.expire() ; on n'en double pas le toast.
      const sessionHandled = apiError.kind === 'session-expired' && !isAuthRequest;
      const show =
        cfg.toastOnError && !req.context.get(SKIP_ERROR_TOAST) && !apiError.silent &&
        apiError.kind !== 'cancelled' && !sessionHandled;

      if (show) {
        const fields = apiError.fieldErrors ? Object.values(apiError.fieldErrors).flat().slice(0, 3).join(' · ') : '';
        const action = apiError.action;
        toast.show(apiError.severity, {
          id: `art-api-${apiError.status}-${apiError.code ?? apiError.kind}`,
          title: apiError.title && apiError.kind === 'business' ? apiError.title : undefined,
          message: fields ? `${apiError.message} ${fields}` : apiError.message,
          action: action
            ? {
                label: action.label,
                handler: () => {
                  if (action.handler) action.handler();
                  else if (action.route) void router.navigateByUrl(action.route);
                  else if (action.href) window.open(action.href, '_blank', 'noopener,noreferrer');
                },
              }
            : undefined,
        });
      }
      return throwError(() => apiError);
    }),
  );
};
