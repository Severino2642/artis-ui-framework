# Intercepteurs HTTP — `@artis/api`

`provideArtApi()` installe les intercepteurs dans cet ordre (du plus **externe** au plus **interne**) :

| # | Intercepteur | Rôle |
|---|---|---|
| 1 | `requestIdInterceptor` | Ajoute `X-Request-Id` (UUID) aux requêtes vers le backend |
| 2 | `csrfInterceptor` | Double-submit cookie → en-tête CSRF (méthodes non sûres, backend seulement) |
| 3 | `loaderInterceptor` | Incrémente/décrémente `LoaderService` |
| 4 | `errorInterceptor` | Convertit l'erreur en `ApiError` + toast |
| 5 | `authInterceptor` | Joint le Bearer, refresh proactif/réactif, rejeu après 401 |
| 6… | *vos intercepteurs* | via `provideArtApi(cfg, { interceptors: [...] })` |

`error` est **extérieur** à `auth` : il ne voit que les erreurs **finales**, après la tentative de refresh.

## Qui est « le backend » ?
Une requête est jointe au jeton/CSRF/`X-Request-Id` seulement si son URL est **relative** ou **commence par `baseUrl`**. Les appels vers un domaine tiers n'en reçoivent jamais.

## Contextes par requête
```ts
import { HttpContext } from '@angular/common/http';
import { SKIP_AUTH, SKIP_ERROR_TOAST, SKIP_LOADER } from '@artis/api';

http.get(url, { context: new HttpContext().set(SKIP_LOADER, true).set(SKIP_ERROR_TOAST, true) });
```
(`ApiService` expose les mêmes choix via `skipLoader`, `skipErrorToast`, `skipAuth`.)

## Utiliser les intercepteurs seuls
Ils sont exportés (`authInterceptor`, `errorInterceptor`, `loaderInterceptor`, `csrfInterceptor`, `requestIdInterceptor`) pour une composition manuelle avec `provideHttpClient(withInterceptors([...]))`.

## Écrire le sien
```ts
export const tenantInterceptor: HttpInterceptorFn = (req, next) =>
  next(req.clone({ setHeaders: { 'X-Tenant': inject(TenantService).current() } }));

provideArtApi(cfg, { interceptors: [tenantInterceptor] });
```

## Pièges
* Un intercepteur qui avale l'erreur (`catchError(() => of(null))`) empêche le toast.
* `withCredentials: true` + CORS : le backend doit répondre `Access-Control-Allow-Credentials: true` et une origine explicite.
