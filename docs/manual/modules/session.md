# Session, jetons et guards — `@artis/api`

## À quoi ça sert
Connexion, déconnexion, rafraîchissement automatique du jeton, expiration, et protection des routes.

## Démarrage rapide
```ts
const session = inject(SessionService);
session.login({ username, password }).subscribe(() => router.navigate(['/']));
session.logout();                       // prévient le serveur, vide les jetons, redirige vers /login
```
```ts
// routes
{ path: 'admin', canActivate: [authGuard, roleGuard(['admin'])], loadComponent: … },
{ path: 'login', canActivate: [guestGuard], loadComponent: … },
```

## `SessionService`
| Membre | Rôle |
|---|---|
| `login(credentials)` | `POST authEndpoints.login`, stocke les jetons (via `mapAuthResponse`) |
| `logout({ redirect?, notifyServer? })` | Déconnexion (redirige par défaut) |
| `setTokens(pair)` | Pose des jetons obtenus ailleurs (SSO/OAuth). L'expiration est déduite de `expiresAt` ou de la claim JWT `exp` |
| `refresh()` | Rafraîchit le jeton. Appels concurrents = **une seule** requête |
| `ensureValidToken()` | Retourne un jeton valide (rafraîchit si besoin) ou `null` |
| `expire(returnUrl?)` | Session expirée : toast + redirection `loginRoute?returnUrl=…` |
| `invalidate(status?)` / `redirectToLogin()` | Variantes sans toast |
| `status()` | `'anonymous'` · `'authenticated'` · `'expired'` |
| `isAuthenticated()` | Signal booléen |
| `user()` | Claims du JWT (ou profil posé par `setUser`) |
| `accessToken`, `refreshToken`, `expiresAt`, `isTokenExpired(skew)` | Lecture |

## Format de réponse d'authentification
Par défaut sont reconnus : `accessToken` / `access_token` / `token` / `jwt`, `refreshToken` / `refresh_token`, `expiresIn` / `expires_in`, éventuellement sous `data`. Autre format :
```ts
provideArtApi({ mapAuthResponse: (b) => ({ accessToken: (b as any).jeton, expiresAt: Date.parse((b as any).fin) }) })
```

## Stockage des jetons
`storage: 'memory'` (recommandé) · `'sessionStorage'` · `'localStorage'`. Stockage personnalisé : `{ provide: ART_TOKEN_STORAGE, useValue: monStockage }` (interface `get/set/remove`).

## Guards
| Guard | Rôle |
|---|---|
| `authGuard` | Autorise si la session est valide (rafraîchit si besoin), sinon redirige vers le login avec `returnUrl` |
| `guestGuard` | Pages publiques (login) : redirige vers `homeRoute` si déjà connecté |
| `roleGuard(roles, { claim?, forbiddenRoute? })` | Autorise si la claim `roles` (ou `claim`) contient un rôle ; sinon `/forbidden` |

> Un guard améliore l'expérience ; il ne remplace **jamais** le contrôle des droits côté serveur.

## Que se passe-t-il sur un 401 ?
1. L'intercepteur tente **un** refresh (si refresh token ou cookie) et **rejoue** la requête.
2. Si impossible : session `expired`, toast « Votre session a expiré », redirection vers le login avec `returnUrl`.
3. Les 401 simultanés partagent un seul refresh.

## Pièges
* Après `login`, redirigez vous-même (`returnUrl` est dans la query de la page de login).
* `roleGuard` lit les claims du **jeton** : déconnectez/reconnectez après un changement de rôle.
