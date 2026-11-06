# Client API — `@artis/api`

## À quoi ça sert
Une seule porte d'entrée vers le backend : appels HTTP, pagination/tri/filtres standardisés, envoi de fichiers avec progression, annulation, gestion centralisée des erreurs (avec toasts automatiques) et loader global. L'authentification est décrite dans [session](session.md), les intercepteurs dans [interceptors](interceptors.md).

## Démarrage rapide
```ts
// app.config.ts
provideRouter(routes),
provideToaster(),
provideArtApi({
  baseUrl: 'https://api.mon-projet.com',   // sans slash final
  storage: 'memory',
  businessErrors: { QUOTA_EXCEEDED: { message: 'Quota atteint.', action: { label: 'Augmenter', route: '/plan' } } },
})
```
```ts
const api = inject(ApiService);
api.get<Client[]>('/clients').subscribe(clients => this.clients = clients);
api.post<Client>('/clients', { name: 'Acme' }).subscribe(c => …);
```
Les erreurs HTTP affichent **automatiquement** leur toast ; vous n'avez rien à écrire dans vos composants.

## `ApiService`
| Méthode | Retour | Rôle |
|---|---|---|
| `get<T>(path, opts?)` | `Observable<T>` | GET |
| `post<T>(path, body?, opts?)` | `Observable<T>` | POST |
| `put<T>` / `patch<T>(path, body?, opts?)` | `Observable<T>` | PUT / PATCH |
| `delete<T>(path, opts?)` | `Observable<T>` | DELETE |
| `list<T>(path, query?, opts?)` | `Observable<Page<T>>` | Liste paginée/triée/filtrée (voir ci-dessous) |
| `upload<T>(path, file, opts?)` | `Observable<UploadEvent<T>>` | Envoi multipart avec progression |
| `getAsync` · `postAsync` · `putAsync` · `patchAsync` · `deleteAsync` | `Promise<T>` | Variantes Promise (reprise de l'ancien code) |
| `cancel(key)` / `cancelAll()` | `void` | Annulation |
| `buildUrl(path)` | `string` | URL finale (préfixe `baseUrl`) |

### Options d'une requête (`RequestOptions`)
| Option | Rôle |
|---|---|
| `params` | Query params. `null`, `undefined`, `''` ignorés ; tableau ⇒ paramètre répété ; `Date` ⇒ ISO |
| `headers` | En-têtes additionnels |
| `signal` | `AbortSignal` : `abort()` annule la requête |
| `cancelKey` | Un nouvel appel avec la **même clé** annule le précédent (recherche, autocomplétion) |
| `skipLoader` | Pas de loader global |
| `skipErrorToast` | Pas de toast d'erreur (l'erreur est quand même propagée) |
| `skipAuth` | N'ajoute pas le jeton (appel public) |

Une requête **annulée** se termine sans valeur ni erreur et n'affiche aucun toast.

### URL : `baseUrl` et chemins
* `'/clients'` → `baseUrl + '/clients'`.
* URL absolue (`https://…`) → inchangée (et **sans** jeton ni CSRF : jamais envoyés à un tiers).
* Un chemin qui commence **déjà** par `baseUrl` (ex. `baseUrl: '/api'`, chemin `'/api/upload'`) n'est pas préfixé deux fois.

## Listes : `api.list`
```ts
api.list<Client>('/clients', {
  page: 1, pageSize: 20,
  sort: [{ field: 'name', direction: 'asc' }, { field: 'age', direction: 'desc' }],
  filters: { status: 'ok', tags: ['a', 'b'] },
  search: 'acme',
}).subscribe(page => { page.items; page.total; });
```
Requête produite (contrat par défaut) : `?page=1&pageSize=20&sort=name:asc,age:desc&q=acme&filter[status]=ok&filter[tags]=a&filter[tags]=b`.

Réponse acceptée : `{items,total}`, `{data,total}`, `{content,totalElements}` (Spring), `{results,count}` ou un simple tableau → normalisée en `Page<T> = { items, total, page, pageSize }`.

Adapter au backend du projet :
```ts
provideArtApi({ listContract: { pageParam: 'p', pageSizeParam: 'limit', sortParam: 'order', searchParam: 'search',
  filterParam: (k) => `f_${k}`, firstPage: 0, mapPage: (body) => ({ items: body.rows, total: body.n, page: 0, pageSize: 20 }) } })
```

## Envoi de fichiers : `api.upload`
```ts
api.upload<{ id: number; url: string }>('/files', file, { fieldName: 'document', fields: { folder: 'logos' } })
  .subscribe(e => e.type === 'progress' ? this.pct = e.percent : this.done(e.body));
```
Émet `{ type: 'progress', loaded, total, percent }` puis `{ type: 'done', body }`. Le champ de formulaire [file-field](../ui/file-field.md) s'en sert.

## Erreurs : `ApiError`
Tout échec HTTP arrive sous forme d'`ApiError` (jamais de `HttpErrorResponse` brut) :

| Propriété | Contenu |
|---|---|
| `kind` | `validation` · `session-expired` · `forbidden` · `not-found` · `conflict` · `rate-limited` · `server` · `unavailable` · `timeout` · `network` · `business` · `cancelled` · `unknown` |
| `status` | Code HTTP (`0` = réseau) |
| `message` | Message **destiné à l'utilisateur** (jamais le texte brut du serveur) |
| `title`, `detail` | Champs RFC 7807 du serveur (techniques) |
| `code` | Code métier éventuel |
| `fieldErrors` | `{ champ: ['message'] }` pour les 400/422 |
| `traceId` | `X-Request-Id` / `traceId` pour le support |
| `action` | Action proposée (erreurs métier) |

```ts
api.post('/clients', body).subscribe({
  error: (e: ApiError) => { if (e.kind === 'validation') this.form.setErrors(e.fieldErrors); },
});
```

### Messages par statut
| HTTP | `kind` | Message par défaut |
|---|---|---|
| 400, 422 | `validation` | Requête / données invalides (+ erreurs par champ dans le toast) |
| 401 | `session-expired` | Session expirée (refresh tenté avant) · sur le login : « Identifiants incorrects. » |
| 403 | `forbidden` | Accès refusé |
| 404 | `not-found` | Ressource introuvable |
| 409 | `conflict` | Conflit |
| 429 | `rate-limited` | Trop de requêtes |
| 500 | `server` | Erreur serveur |
| 502, 503 | `unavailable` | Service indisponible |
| 408, 504 | `timeout` | Délai dépassé |
| 0 | `network` | Impossible de joindre le serveur |

Surcharge : `provideArtApi({ statusMessages: { 404: 'Rien ici.', network: '…', loginFailed: '…' } })`.

### Codes d'erreur **métier**
```ts
provideArtApi({
  businessErrors: {
    BILLING_RESTRICTED: { message: 'Abonnement restreint. {detail}', title: 'Facturation',
      action: { label: 'Voir ma facturation', route: '/billing' } },     // ou { href } ou { handler }
    SILENT_CODE: { message: '…', silent: true },                         // pas de toast
  },
})
```
Le code est lu dans `code`, `error.code`, `errorCode`, l'en-tête `X-Error-Code`, ou via `extractErrorCode: (body, headers) => …`. `{detail}` est remplacé par le détail du serveur.

### RFC 7807 (`application/problem+json`)
`type`, `title`, `status`, `detail`, `instance`, `errors`, `code`, `traceId` sont lus. Le **message affiché** vient toujours de la table ci-dessus (le `detail` peut être technique) ; il reste disponible sur l'`ApiError`.

## Loader global
`LoaderService` compte les requêtes en cours (`loading()` signal, `loading$` observable) ; `<art-loader />` l'affiche ([loader](../ui/loader.md)). Exclusions : `loaderExcludedUrls: ['/poll']` ou `skipLoader: true` par requête.

## Configuration (`ArtApiConfig`)
| Option | Défaut | Rôle |
|---|---|---|
| `baseUrl` | `''` | URL de base du backend |
| `storage` | `'sessionStorage'` | `'memory'` · `'sessionStorage'` · `'localStorage'` |
| `storagePrefix` | `'art'` | Préfixe des clés de stockage |
| `authEndpoints` | `/auth/login`, `/auth/logout`, `/auth/refresh` | Endpoints d'auth |
| `loginRoute` / `homeRoute` | `/login` / `/` | Redirections |
| `tokenHeader` / `tokenPrefix` | `Authorization` / `Bearer` | En-tête du jeton |
| `refreshSkewSeconds` | `30` | Refresh proactif avant expiration |
| `mapAuthResponse` | formats courants | Convertit la réponse de login/refresh en `TokenPair` |
| `requestIdHeader` | `X-Request-Id` | `false` pour désactiver |
| `csrf` | `false` | `{ cookieName, headerName }` (double submit) |
| `withCredentials` | `false` | Envoie les cookies |
| `statusMessages` / `businessErrors` / `extractErrorCode` | — | Voir ci-dessus |
| `toastOnError` | `true` | Toast automatique |
| `onError` | — | Callback pour journalisation/monitoring (reçoit l'`ApiError`) |
| `loaderExcludedUrls` | `[]` | Sous-chaînes d'URL sans loader |
| `listContract` | voir `list` | Contrat de pagination |

`provideArtApi(config, { interceptors: [monIntercepteur] })` ajoute vos intercepteurs **au plus près du backend** (en dernier).

## Sécurité (rappel)
Voir [../../SECURITY.md](../../SECURITY.md) : jeton jamais envoyé à un tiers, `escapeHtml`/`sanitizeUrl`, CSRF, stockage recommandé `memory`.

## Pièges
* `baseUrl` sans slash final ; chemins avec slash initial.
* Appelez `provideToaster()` **avant** `provideArtApi()` (l'API affiche des toasts) et placez `<art-toast-container />`.
* Pas de `subscribe` oublié : `ApiService` est « froid », rien ne part sans abonnement (ou `*Async`).
