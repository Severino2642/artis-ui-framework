import { DOCUMENT } from '@angular/common';
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { ART_API_CONFIG } from '../api.config';
import { isApiRequest } from './utils';

const SAFE = new Set(['GET', 'HEAD', 'OPTIONS']);

function readCookie(doc: Document, name: string): string | null {
  const match = doc.cookie.split('; ').find((c) => c.startsWith(name + '='));
  return match ? decodeURIComponent(match.substring(name.length + 1)) : null;
}

/**
 * CSRF « double submit cookie » : recopie la valeur du cookie anti-CSRF dans un en-tête
 * pour les méthodes non sûres. Actif seulement si `csrf` est configuré.
 */
export const csrfInterceptor: HttpInterceptorFn = (req, next) => {
  const cfg = inject(ART_API_CONFIG);
  if (!cfg.csrf || SAFE.has(req.method) || !isApiRequest(req, cfg) || req.headers.has(cfg.csrf.headerName)) {
    return next(req);
  }
  const token = readCookie(inject(DOCUMENT), cfg.csrf.cookieName);
  return next(token ? req.clone({ setHeaders: { [cfg.csrf.headerName]: token } }) : req);
};
