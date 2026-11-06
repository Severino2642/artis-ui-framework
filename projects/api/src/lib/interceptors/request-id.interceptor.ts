import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { ART_API_CONFIG } from '../api.config';
import { isApiRequest, randomId } from './utils';

/** Ajoute `X-Request-Id` (identifiant de trace) à chaque requête vers le backend. */
export const requestIdInterceptor: HttpInterceptorFn = (req, next) => {
  const cfg = inject(ART_API_CONFIG);
  const header = cfg.requestIdHeader;
  if (!header || req.headers.has(header) || !isApiRequest(req, cfg)) return next(req);
  return next(req.clone({ setHeaders: { [header]: randomId() } }));
};
