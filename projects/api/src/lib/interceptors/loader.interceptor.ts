import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { ART_API_CONFIG, SKIP_LOADER } from '../api.config';
import { LoaderService } from '../loader/loader.service';

/** Affiche le loader global sauf si `SKIP_LOADER` ou si l'URL contient une entrée de `loaderExcludedUrls`. */
export const loaderInterceptor: HttpInterceptorFn = (req, next) => {
  const cfg = inject(ART_API_CONFIG);
  if (req.context.get(SKIP_LOADER) || cfg.loaderExcludedUrls.some((u) => req.url.includes(u))) return next(req);
  const loader = inject(LoaderService);
  loader.show();
  return next(req).pipe(finalize(() => loader.hide()));
};
