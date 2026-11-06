# `art-main-layout` — gabarit d'application

## À quoi ça sert
Coquille applicative complète : **sidebar** de navigation, **header** (titre, fil d'Ariane, recherche, notifications, profil), zone de contenu (`<router-outlet>`) et **footer**. Entièrement piloté par des entrées : aucune donnée ni logique du projet n'est embarquée.

**Sélecteur** `art-main-layout` · **Import** `ArtMainLayoutComponent`

## Démarrage rapide
```ts
@Component({
  standalone: true,
  imports: [ArtMainLayoutComponent, ArtLoaderComponent, ToastContainerComponent],
  template: `
    <art-main-layout [menuItems]="menu" [user]="user" brandName="Mon app" logoUrl="/assets/logo.svg"
                     [notifications]="notifs" (search)="onSearch($event)" (profileAction)="onProfile($event)" />
    <art-toast-container />
    <art-loader />`,
})
export class App {
  user = { name: 'Ada Lovelace', email: 'ada@exemple.com' };
  menu: NavbarItemCPLModel[] = [
    { id: 'home',  nom: 'Accueil',  icon: 'home',      route: '/',        order: 0, niveau: 0 },
    { id: 'sales', nom: 'Ventes',   icon: 'point_of_sale', route: '/sales', order: 1, niveau: 0 },
  ];
}
```
Les pages s'affichent dans le `<router-outlet>` du layout : déclarez-les comme routes enfants.

<!-- API:art-main-layout -->
Source : `ui/src/lib/layout/main-layout/main-layout.component.ts`
**Entrées**

| Nom | Type | Défaut | Rôle |
|---|---|---|---|
| `menuItems` | `NavbarItemCPLModel[]` | `[]` | Entrées de navigation (arbre). Si absent et `menusEndpoint` fourni, elles sont chargées via l'API. |
| `menusEndpoint` | `string` | — | Endpoint de chargement des menus (optionnel). |
| `notifications` | `NotificationItem[]` | `[]` | — |
| `profileMenuItems` | `ProfileMenuItem[]` | `[` | — |
| `brandName` | `any` | `''` | — |
| `logoUrl` | `any` | `''` | — |
| `searchPlaceholder` | `any` | `'Rechercher…'` | — |
| `footerLinkGroups` | `FooterLinkGroup[]` | `[]` | — |
| `showFooter` | `any` | `true` | — |
| `alternatePanel` | `any` | `false` | Remplace la navigation par le contenu `[artSidebarPanel]`. |
| `pageTitle` | `string` | — | Titre de page ; par défaut `MainLayoutService.pageTitle`. |
| `autoLogout` | `any` | `true` | Si vrai (défaut), l'action de profil `logout` déconnecte via `SessionService`. |

**Sorties (événements)**

| Nom | Type | Rôle |
|---|---|---|
| `itemSelected` | `NavbarItemCPLModel` | — |
| `profileAction` | `ProfileMenuItem` | — |
| `logout` | `void` | — |
| `search` | `string` | — |
| `notificationRead` | `string` | — |
| `help` | `void` | — |
| `breadcrumbClick` | `BreadcrumbItem` | — |
<!-- /API -->

## Menus
`NavbarItemCPLModel` : `{ id, nom, icon?, route?, order, niveau, filles?: NavbarItemCPLModel[] }` — `filles` pour les sous-menus. Menus **statiques** (`menuItems`) ou **chargés** : `menusEndpoint="/menus"` appelle l'API (via `ArtSidebarService`, configurable par `ART_SIDEBAR_CONFIG`).

## Titre de page
`[pageTitle]="'Ventes'"`, ou, depuis n'importe quelle page : `inject(ArtMainLayoutService).setPageTitle('Ventes')`.

## Profil et déconnexion
`profileMenuItems` (défaut : « Se déconnecter »). L'action `logout` émet `logout` **et**, si `autoLogout` (défaut `true`), appelle `SessionService.logout()`. `autoLogout=false` pour gérer vous-même.

## Panneau latéral alternatif
`[alternatePanel]="true"` remplace la navigation par le contenu projeté :
```html
<art-main-layout [alternatePanel]="editing">
  <my-tools-panel artSidebarPanel />
</art-main-layout>
```

## Accessibilité
Landmarks (`<main>`, navigation), boutons nommés, focus visible. À votre charge : un titre de page par route (`setPageTitle`) et des libellés de menu explicites.

## Pièges
* Placez `<art-toast-container />` et `<art-loader />` **à côté** du layout, pas dedans.
* Le layout occupe toute la hauteur de la fenêtre (`100vh`) : ne l'imbriquez pas dans un conteneur à hauteur contrainte.
