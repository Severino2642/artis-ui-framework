# Sécurité

## Jetons et session (`@artis/api`)

| Sujet | Comportement |
|---|---|
| Stockage | `storage: 'memory' \| 'sessionStorage' \| 'localStorage'`. **Recommandé : `memory`** (perdu au rechargement, hors de portée d'un script injecté) avec refresh par cookie `HttpOnly` (`withCredentials: true`). `sessionStorage` est un compromis ; `localStorage` expose les jetons à toute XSS. Stockage personnalisable via `ART_TOKEN_STORAGE`. |
| Portée du jeton | `Authorization: Bearer …` n'est ajouté **qu'aux requêtes vers le backend** (URL relative ou commençant par `baseUrl`). Jamais vers un domaine tiers (testé). `X-Request-Id` et l'en-tête CSRF suivent la même règle. |
| Refresh | Proactif (`refreshSkewSeconds` avant l'expiration) et réactif (401 → un refresh → rejeu). Les 401 simultanés **partagent un seul** refresh. Échec ⇒ session `expired`, toast, redirection `loginRoute?returnUrl=…`. |
| Expiration | Déduite de `expiresAt`, `expires_in` ou de la claim JWT `exp`. La signature n'est **pas** vérifiée côté client (rôle du serveur). |
| Journalisation | Les jetons et valeurs `secret` ne sont jamais écrits dans les logs. `onError` reçoit un `ApiError` (jamais le jeton). |
| Guards | `authGuard`, `guestGuard`, `roleGuard(['admin'])` (claim `roles`). **Un guard n'est pas une autorisation** : le serveur doit toujours contrôler les droits. |

## CSRF

Si l'authentification repose sur des **cookies**, activez le *double submit* :

```ts
provideArtApi({ withCredentials: true, csrf: { cookieName: 'XSRF-TOKEN', headerName: 'X-XSRF-TOKEN' } })
```

L'en-tête est recopié depuis le cookie pour les méthodes non sûres (POST, PUT, PATCH, DELETE) vers le backend uniquement. Avec un jeton Bearer en en-tête (pas de cookie d'auth), le CSRF ne s'applique pas.

## XSS

* **Politique par défaut : aucun `bypassSecurityTrust*`** dans le framework ni `innerHTML` sur du contenu fourni par l'appelant.
* Les explications contextuelles (Markdown restreint) sont rendues par **un arbre de nœuds Angular** (interpolation = échappement), pas par `innerHTML`. Seuls gras, italique, liens et sauts de ligne existent ; un lien dont le schéma n'est pas `http(s)`, `mailto`, `tel` ou relatif devient du texte (`javascript:`, `data:`, `vbscript:` bloqués).
* `escapeHtml()` et `sanitizeUrl()` sont exportés par `@artis/api` pour construire du HTML à la main.
* L'export PDF de `data-list` échappe toutes les valeurs.
* Les notifications du header acceptent un `message` HTML : il passe par le **sanitizer d'Angular** (`[innerHTML]`). N'y injectez que du contenu maîtrisé.

### Quand `bypassSecurityTrust*` est-il acceptable ?

Uniquement si **toutes** ces conditions sont réunies : (1) la source est interne et de confiance, (2) le contenu est validé/assaini **côté serveur**, (3) aucune donnée utilisateur n'y entre, (4) le choix est commenté et relu. Préférez un composant dédié ou une liste blanche de balises.

## Champ `secret`

* Lecture seule masquée : **la valeur n'est pas dans le DOM** (seul le masque l'est).
* Révélation temporaire : re-masquage automatique (`secretRevealTimeout`, 10 s par défaut).
* Édition : `<input type="password" autocomplete="new-password">`.
* Copie : API Clipboard, repli `execCommand` ; retour visuel + annonce vocale ; aucun log.

## Upload

La validation côté client (type, taille, nombre) est une **aide à l'utilisateur**, pas une barrière de sécurité : revalidez toujours côté serveur (type réel, taille, antivirus).
