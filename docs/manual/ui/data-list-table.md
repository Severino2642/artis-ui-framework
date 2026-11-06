# `art-dl-table` — tableau et cartes

## À quoi ça sert
Rendre les lignes d'une [data-list](data-list.md) en **tableau** ou en **cartes**, avec en-têtes triables/filtrables, cases à cocher, actions par ligne et pagination. En pratique vous utilisez `art-data-list`, qui le pilote ; ce composant sert pour une intégration très spécifique.

**Sélecteur** `art-dl-table` · **Import** `ArtDataListTableComponent`

<!-- API:art-dl-table -->
Source : `ui/src/lib/list/data-list-table/data-list-table.component.ts`
**Entrées**

| Nom | Type | Défaut | Rôle |
|---|---|---|---|
| `columns` | `ColumnDef[]` | `[]` | — |
| `actions` | `RowAction[]` | `[]` | — |
| `showActions` | `any` | `true` | — |
| `showCheckbox` | `any` | `false` | — |
| `viewMode` | `'table' \| 'card'` | `'table'` | — |
| `isMobile` | `boolean` | `false` | — |
| `activeSorts` | `SortState[]` | `[]` | — |
| `activeFilters` | `Record<string, any>` | `{}` | Filtres actifs (clé = nom du champ de filtre). |
| `columnFilterFields` | `Record<string, FormFieldConfig>` | `{}` | Champ de filtre de chaque colonne `filterable` (clé = `ColumnDef.key`). |
| `data` | `any[]` | `[]` | — |
| `allData` | `any[]` | `[]` | — |
| `pageSize` | `any` | `10` | — |
| `isAutoPagination` | `any` | `true` | — |
| `totalCount` | `any` | `0` | — |
| `currentPage` | `any` | `1` | — |
| `selectedButtonLabel` | `any` | `'Actions sélectionnées'` | — |
| `selectedButtonIcon` | `any` | `'checklist'` | — |

**Sorties (événements)**

| Nom | Type | Rôle |
|---|---|---|
| `sortChange` | `SortState[]` | Clic sur l'icône de tri d'un en-tête : émet le nouvel état de tri (vide = aucun). |
| `columnFilter` | `{ field: string; value: any }` | Filtre de colonne appliqué (`value: null` = retiré). |
| `cellFilter` | `{ field: string; value: any }` | Clic sur une valeur `filterOnClick` (égalité ; `value: null` si déjà actif = retire le filtre). |
| `actionClick` | `{ actionId: string; row: any }` | — |
| `selectionChange` | `any[]` | — |
| `selectedAction` | `any[]` | — |
| `pageChange` | `{ start: number; end: number; page: number; pageSize: number }` | — |
<!-- /API -->

## Colonnes : `ColumnDef`
| Propriété | Rôle |
|---|---|
| `key` | Identifiant unique de la colonne |
| `title` | Titre (en-tête et accessibilité) |
| `sections` | Contenu : `[{ fields: ColumnField[], colMd? }]` — une cellule peut empiler plusieurs champs |
| `visible` | `false` masque la colonne |
| `width` | Largeur CSS (`'120px'`, `'20%'`) |
| `sortable` | Icône de tri dans l'en-tête |
| `sortKey` | Chemin triable (défaut : 1er attribut) |
| `filterable` | `true` ou `FormFieldConfig` partiel : icône de filtre ([data-list-column-filter](data-list-column-filter.md)) |
| `showInCardHeader`, `cardHeaderAlign` | Place le champ dans l'en-tête de la carte |
| `explanation`, `explanationTrigger` | ⓘ à côté du titre |

## Champs de cellule : `ColumnField`
| Propriété | Rôle |
|---|---|
| `attribute` | Chemin (`'boutique.nom'`) |
| `type` | `text` (défaut) · `number` · `date` · `image` · `badge` · `link` |
| `unit` | Unité affichée après la valeur |
| `dateFormat` | `'dd/MM/yyyy HH:mm'` |
| `maxLength` | Tronque le texte avec « … » |
| `formatDuration` | Affiche un nombre comme une durée |
| `badgeColorMap`, `badgeDefaultColor` | Couleur par valeur de badge. Utilisez des **tokens** : `'var(--art-success)'` |
| `linkHref`, `linkTarget`, `isRedirectLink` | Pour `type: 'link'` |
| `style`, `cssClass` | Personnalisation locale |
| `filterOnClick` | Un clic sur la valeur filtre la liste |

## Exemple
```ts
{ key: 'customer', title: 'Client', width: '220px', sortable: true, filterable: true,
  explanation: 'Raison sociale, tel que saisi à la création.',
  sections: [{ fields: [{ attribute: 'customer.name' }, { attribute: 'customer.city', cssClass: 'text-muted' }] }] }
```

## Accessibilité
`aria-sort` sur les en-têtes triables ; icônes de tri/filtre = boutons nommés (« Trier par Prix », « Filtrer la colonne Prix ») ; valeurs filtrables au clavier (Entrée) avec `aria-pressed`.

## Pièges
* `badgeColorMap` avec des `#hex` fonctionne mais ne suit pas les thèmes : préférez `var(--art-…)`.
* Le tri/filtre par en-tête ne **calcule** rien tout seul : c'est [data-list](data-list.md) qui recalcule (mode local) ou émet les événements (mode manuel).
