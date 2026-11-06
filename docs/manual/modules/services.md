# Services utilitaires — `@artis/ui`

## `ArtFieldValidationService`
Valide une valeur selon des validateurs. Utilisé par les formulaires ; utilisable seul.
```ts
const results = await inject(ArtFieldValidationService).validate(value, { validators: [{ type: 'required' }, { type: 'email' }] }, allFormValues);
```
Validateurs : `required`, `minLength`/`maxLength` (`length`), `min`/`max` (`value`, nombre ou date), `pattern` (`pattern`, `flags`), `email`, `url`, `custom` (`fn` synchrone ou `asyncFn` asynchrone ; reçoivent aussi toutes les valeurs du formulaire). Chaque validateur accepte `message`. `stopOnFirstError` arrête à la première erreur.
**Règle** : sur une valeur **vide**, seuls `required` et `custom` s'évaluent (un champ optionnel vide est valide).

## `ArtFormBuilderService`
`reformatToOptionValues(items, valueKey, labelKey)` → `[{ value, label }]` (valeur convertie en chaîne) ; `deepGet(obj, 'a.b')`.

## `ArtDataListUtilsService`
Utilitaires de [data-list](../ui/data-list.md) : `deepGet`, `formatDate`, `sortData`, **`filterData`**, `matchesFilter`, `autoFilterFields`, `columnFilterField`, `hasFilterValue`, `normalizeText`, `computeStat`/`computeAllStats`, `getCellDisplayValue`, `getBadgeColor`, `flattenRow`, exports (`exportCSV/Excel/XML/JSON/PDF`), `safeCell` (anti-injection de formule).
```ts
const utils = inject(ArtDataListUtilsService);
const rows = utils.filterData(data, { name: 'ecran', price: { min: 10, max: null } }, utils.autoFilterFields(columns, data));
```

## `ArtDetailViewUtilsService`
Pour [detail-card](../ui/detail-card.md) : valeurs d'affichage, badges, multibadges, résolution de liens.

## `ArtMainLayoutService`
`setPageTitle(titre)` / `getPageTitle()` / signal `pageTitle` : titre de page affiché par [header](../ui/header.md) via [main-layout](../ui/main-layout.md).

## `ArtSidebarService`
Chargement des menus et mémorisation de la navigation. Configurable par `ART_SIDEBAR_CONFIG` :
```ts
{ provide: ART_SIDEBAR_CONFIG, useValue: { menusEndpoint: '/menus', activeKey: 'app.nav.active', breadcrumbKey: 'app.nav.bc', storage: 'sessionStorage' } }
```
Méthodes : `getAll(endpoint?)`, `getById(id)`, `getActiveSideBar()`, `getBreadCumbs()`, `updateActualSideBar(item, trail)`.

## `formatNombre` / `formatDuration`
`formatNombre(1234.5, { precision: 2, compact?, percent?, currency?, showSign? })` → `1 234,50` (espace fine insécable, virgule) ; `—` si invalide. `formatDuration` formate une durée (voir `DurationConfig`).

## `ThemeService`, `ToastService`, `ApiService`, `SessionService`, `ModalService`, `LoaderService`
Voir leurs pages : [theme](theme.md), [toaster](toaster.md), [api](api.md), [session](session.md), [modal](modal.md).
