# `art-header` — en-tête applicatif

## À quoi ça sert
Barre supérieure : titre de page, **fil d'Ariane**, **recherche**, **notifications**, **aide** et **menu de profil**. Utilisé par [main-layout](main-layout.md) ; utilisable seul.

**Sélecteur** `art-header` · **Import** `ArtHeaderComponent`

## Démarrage rapide
```html
<art-header pageTitle="Ventes" [breadcrumbs]="crumbs" [notifications]="notifs" [user]="user"
            [profileMenuItems]="profileItems"
            (searchSubmit)="search($event)" (notificationRead)="markRead($event)" (profileAction)="onProfile($event)" />
```

<!-- API:art-header -->
Source : `ui/src/lib/layout/header/header.component.ts`
**Entrées**

| Nom | Type | Défaut | Rôle |
|---|---|---|---|
| `pageTitle` | `any` | `''` | — |
| `breadcrumbs` | `BreadcrumbItem[]` | `[]` | Fil d'Ariane complet |
| `notifications` | `NotificationItem[]` | `[]` | Liste complète des notifications |
| `user` | `HeaderUser` | `{ name: '', email: '' }` | Données de l'utilisateur connecté |
| `profileMenuItems` | `ProfileMenuItem[]` | `[]` | Menu du profil |
| `searchPlaceholder` | `any` | `'Rechercher…'` | Placeholder de la barre de recherche |
| `searchValue` | `any` | `''` | Valeur courante de la recherche (two-way si besoin) |
| `sidebarWidth` | `any` | `260` | Largeur du sidebar (pour le décalage margin-left) |
| `sidebarCollapsed` | `any` | `false` | Sidebar réduit en mode icônes |

**Sorties (événements)**

| Nom | Type | Rôle |
|---|---|---|
| `searchChange` | `string` | — |
| `searchSubmit` | `string` | — |
| `notificationRead` | `string` | id notif |
| `notificationsClear` | `void` | — |
| `profileAction` | `ProfileMenuItem` | — |
| `breadcrumbClick` | `BreadcrumbItem` | — |
| `helpClick` | `void` | — |
<!-- /API -->

## Modèles
| Modèle | Champs |
|---|---|
| `BreadcrumbItem` | `{ label, route?, icon? }` — sans `route` = page courante (non cliquable) |
| `NotificationItem` | `{ id, title, message, time, icon, category: 'today' \| 'week' \| 'earlier', severity: 'info' \| 'success' \| 'warning' \| 'error', isRead }` |
| `ProfileMenuItem` | `{ id, label, icon, route?, action?, isDanger?, dividerBefore? }` — `action` = identifiant émis par `profileAction` |

Les notifications affichent `message` via `[innerHTML]` **assaini par Angular** (balises simples telles que `<strong>` conservées, scripts retirés) : n'y placez que du contenu que vous maîtrisez. `time` est un texte libre déjà formaté (« il y a 1 h »).

## Accessibilité
Menus déroulants navigables, boutons nommés, indicateur de notifications non lues.

## Pièges
* `pageTitle` est vide par défaut (le layout le renseigne).
* Une action de profil `id: 'logout'` n'est interprétée comme déconnexion que par [main-layout](main-layout.md).
