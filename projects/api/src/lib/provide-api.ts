import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { HttpInterceptorFn, provideHttpClient, withInterceptors } from '@angular/common/http';
import { ART_API_CONFIG, ArtApiConfig, DEFAULT_API_CONFIG } from './api.config';
import { authInterceptor } from './interceptors/auth.interceptor';
import { csrfInterceptor } from './interceptors/csrf.interceptor';
import { errorInterceptor } from './interceptors/error.interceptor';
import { loaderInterceptor } from './interceptors/loader.interceptor';
import { requestIdInterceptor } from './interceptors/request-id.interceptor';

/**
 * Point d'entrée unique du module d'intégration backend.
 *
 * ```ts
 * // app.config.ts
 * providers: [
 *   provideRouter(routes),
 *   provideToaster({ position: 'top-right' }),
 *   provideArtApi({ baseUrl: 'https://api.exemple.com', storage: 'memory',
 *     businessErrors: { QUOTA_EXCEEDED: { message: 'Quota dépassé.', action: { label: 'Augmenter', route: '/plan' } } } }),
 * ]
 * ```
 * Ordre des intercepteurs (du plus externe au plus interne) :
 * requestId → csrf → loader → error → auth. `error` est externe à `auth` pour ne voir
 * que les erreurs finales, après la tentative de refresh.
 */
export function provideArtApi(
  config: Partial<ArtApiConfig> = {},
  options: { /** Intercepteurs ajoutés EN DERNIER (au plus près du backend) : faux backend de démo, signature de requêtes… */ interceptors?: HttpInterceptorFn[] } = {},
): EnvironmentProviders {
  const merged: ArtApiConfig = {
    ...DEFAULT_API_CONFIG,
    ...config,
    baseUrl: (config.baseUrl ?? DEFAULT_API_CONFIG.baseUrl).replace(/\/+$/, ''),
    authEndpoints: { ...DEFAULT_API_CONFIG.authEndpoints, ...config.authEndpoints },
    listContract: { ...DEFAULT_API_CONFIG.listContract, ...config.listContract },
    statusMessages: { ...DEFAULT_API_CONFIG.statusMessages, ...config.statusMessages },
    businessErrors: { ...DEFAULT_API_CONFIG.businessErrors, ...config.businessErrors },
  };
  return makeEnvironmentProviders([
    { provide: ART_API_CONFIG, useValue: merged },
    provideHttpClient(withInterceptors([requestIdInterceptor, csrfInterceptor, loaderInterceptor, errorInterceptor, authInterceptor, ...(options.interceptors ?? [])])),
  ]);
}
