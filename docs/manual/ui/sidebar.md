# `art-sidebar` — navigation latérale

## À quoi ça sert
Menu de navigation arborescent, **repliable** et **redimensionnable**, avec bloc utilisateur. Sur mobile, il devient un tiroir. Utilisé par [main-layout](main-layout.md).

**Sélecteur** `art-sidebar` · **Import** `ArtSidebarComponent`

## Démarrage rapide
```html
<art-sidebar [navItems]="menu" [activeSideBar]="current" [user]="user" brandName="Mon app" logoUrl="/assets/logo.svg"
             (itemSelected)="onSelect($event)" (onUserButtonClick)="onUser($event)" />
```

<!-- API:art-sidebar -->
Source : `ui/src/lib/layout/sidebar/sidebar.component.ts`
**Entrées**

| Nom | Type | Défaut | Rôle |
|---|---|---|---|
| `brandName` | `any` | `''` | Affiche le contenu projeté `[artSidebarPanel]` à la place de la navigation (ex. panneau d'outils). Nom de la marque affiché à côté du logo. |
| `logoUrl` | `any` | `''` | URL du logo (aucun logo si vide). |
| `alternatePanel` | `boolean` | `false` | — |
| `navItems` | `NavbarItemCPLModel[]` | `[]` | — |
| `user` | `SidebarUser` | `{ name: '', email: '' }` | — |
| `activeSideBar` | `NavbarItemCPLModel` | — | — |

**Sorties (événements)**

| Nom | Type | Rôle |
|---|---|---|
| `itemSelected` | `[NavbarItemCPLModel, NavbarItemCPLModel[]]` | — |
| `onUserButtonClick` | `string` | — |
| `widthChange` | `number` | Émet la largeur effective (px) à chaque changement (collapse/expand, resize manuel, bascule mobile) pour que le layout parent ajuste son `margin-left`. |
| `resizingChange` | `boolean` | true pendant tout le drag de redimensionnement, false sinon — permet au parent de désactiver ses transitions CSS pour un suivi 1:1. |
<!-- /API -->

## Menus : `NavbarItemCPLModel`
`{ id, nom, icon?, route?, order, niveau, filles?: [...] }`. `itemSelected` émet `[item, chemin]` (`chemin` = ancêtres, utile pour le fil d'Ariane).

## Panneau alternatif
`[alternatePanel]="true"` affiche à la place de la navigation le contenu projeté `[artSidebarPanel]`.

## Largeur et mode replié
Largeurs par défaut `--art-sidebar-width` (240 px) et `--art-sidebar-width-collapsed` (64 px) : redéfinissez-les dans votre thème. `widthChange` et `resizingChange` informent le contenu (le layout s'en sert pour décaler la page).

## Accessibilité
Éléments de navigation focusables, état actif indiqué, boutons nommés.

## Pièges
* `brandName` et `logoUrl` sont vides par défaut : rien n'est affiché sans eux.
