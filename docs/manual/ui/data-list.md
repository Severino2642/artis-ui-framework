# `art-data-list` — liste de données (tableau, cartes, filtres, tri, stats, export)

## À quoi ça sert
Afficher une collection avec **tableau ou cartes**, **tri**, **filtres**, **pagination**, **statistiques**, **actions par ligne**, **sélection** et **export** (CSV, Excel, PDF, XML, JSON) à partir d'une seule configuration. Deux façons de travailler : **mode local** (le framework calcule) ou **mode manuel** (vous calculez, par exemple côté serveur).

**Sélecteur** `art-data-list` · **Import** `ArtDataListComponent`

## Démarrage rapide — mode local (le plus simple)
```ts
config: DataListConfig = {
  title: 'Produits',
  localMode: true,                 // le framework filtre, trie et pagine `data`
  pageSize: 10,
  columns: [
    { key: 'name',   title: 'Nom',    sortable: true, filterable: true, sections: [{ fields: [{ attribute: 'name' }] }] },
    { key: 'price',  title: 'Prix',   sortable: true, filterable: true, sections: [{ fields: [{ attribute: 'price', type: 'number', unit: '€' }] }] },
    { key: 'status', title: 'Statut', filterable: true,
      sections: [{ fields: [{ attribute: 'status', type: 'badge', filterOnClick: true,
                             badgeColorMap: { actif: 'var(--art-success)', inactif: 'var(--art-danger)' } }] }] },
  ],
};
```
```html
<art-data-list [config]="config" [data]="products" />
```
C'est tout : en-têtes triables, icône de filtre par colonne, clic sur un badge pour filtrer, pagination, compteurs.

<!-- API:art-data-list -->
Source : `ui/src/lib/list/data-list/data-list.component.ts`
**Entrées**

| Nom | Type | Défaut | Rôle |
|---|---|---|---|
| `config` | `DataListConfig` | **requis** | — |
| `data` | `any[]` | `[]` | — |
| `filterPanelConfig` | `FilterPanelConfig` | — | Optional explicit filter panel config — auto-generated from columns if omitted |

**Sorties (événements)**

| Nom | Type | Rôle |
|---|---|---|
| `filterApply` | `Record<string, any>` | — |
| `sortChange` | `SortState[]` | — |
| `actionClick` | `{ actionId: string; row: any }` | — |
| `selectionAction` | `any[]` | — |
| `pageChange` | `{ start: number; end: number; page: number; pageSize: number }` | — |
| `toolbarAction` | `string` | — |
| `exportFetchPage` | `FetchPageEvent` | When isAutoPagination=false and export needs a specific page |
<!-- /API -->

## Mode local ou manuel : qui calcule ?
| | **Local** (`localMode: true`) | **Manuel** (par défaut) |
|---|---|---|
| Filtrage | Le framework filtre `data` | Le framework n'émet que `filterApply` ; **vous** fournissez des `data` déjà filtrées |
| Tri | Le framework trie `data` | `sortChange` émis ; vous triez |
| Pagination | Locale (`pageSize`) | Locale par défaut, **manuelle** avec `isAutoPagination: false` + `totalCount` |
| Statistiques | Calculées sur les données **filtrées** | Sur les données reçues |
| Cas d'usage | Quelques centaines/milliers de lignes en mémoire | Gros volumes, filtrage serveur |

Les événements `filterApply`, `sortChange` et `pageChange` sont émis **dans tous les modes** : en mode local vous pouvez les écouter (synchroniser l'URL, sauvegarder des préférences) sans rien recalculer.

### Réglage fin (chaque option surcharge `localMode`)
| Option | Défaut | Effet |
|---|---|---|
| `localMode` | `false` | Raccourci qui active les trois suivantes |
| `isAutoSorted` | = `localMode` | Le framework trie |
| `isAutoFiltered` | = `localMode` | Le framework filtre |
| `isAutoPagination` | `true` | Pagination locale ; `false` = manuelle (serveur) |
| `filterFn` | — | `(row, filters) => boolean` : remplace la comparaison standard en mode local |

Exemple — tri et pagination locaux, **filtre côté serveur** :
```ts
config = { localMode: true, isAutoFiltered: false, ... };
onFilter(filters: Record<string, any>) { this.api.list('/items', { filters }).subscribe(p => this.data = p.items); }
```
```html
<art-data-list [config]="config" [data]="data" (filterApply)="onFilter($event)" />
```

### Mode manuel complet (serveur)
```ts
config = { isAutoPagination: false, totalCount: this.total, pageSize: 20, columns: [...] };
```
```html
<art-data-list [config]="config" [data]="page.items"
  (filterApply)="reload({ filters: $event })" (sortChange)="reload({ sort: $event })" (pageChange)="reload({ page: $event.page })" />
```
`SortState = { key, direction }` ; `key` est le chemin de la valeur (voir `sortKey`).

## Tri
* **Par en-tête** : colonne `sortable: true` → icône dans l'en-tête ; clic = croissant → décroissant → aucun. `aria-sort` mis à jour. Clé de tri : `sortKey` (défaut : 1er attribut de la colonne).
* **Barre de tri** (liste déroulante) : `sortFields: [{ key, label }]`. Les deux sont synchronisés.
* Tri local : texte « naturel » (item 2 avant item 10, sans casse ni accents), nombres et dates par valeur, valeurs **vides toujours en dernier**.

## Filtres
Trois façons, **toutes combinables** (ET logique) et synchronisées :

1. **Panneau de filtres** (bouton « Filtrer ») : champs déduits des colonnes, ou personnalisés avec `filterPanelConfig` ([data-list-filter](data-list-filter.md)).
2. **Filtre par colonne** : `filterable: true` (ou un `FormFieldConfig` partiel) → icône dans l'en-tête → petit panneau ([data-list-column-filter](data-list-column-filter.md)).
3. **Clic sur une valeur** : `filterOnClick: true` sur un champ de colonne → un clic filtre sur cette valeur ; un second clic retire le filtre.

Règles de comparaison (mode local) :
| Type du filtre | Comparaison |
|---|---|
| Texte | « contient », **insensible à la casse et aux accents** (`filterMatch: 'startsWith' \| 'equals'` pour changer) |
| Nombre / date (`interval`) | Bornes **incluses**, une seule borne acceptée ; la borne max d'une date inclut **toute la journée** |
| Liste (`select`, badge) | Égalité |
| Multi-choix | « un parmi » |
| Cellule tableau | Correspond si **un** élément correspond |
Les valeurs vides sont ignorées. Chaque changement de filtre ou de tri **revient à la page 1**.

Colonne dont la valeur est dans un autre chemin ? `filterAttribute` (sur le champ de filtre). Logique entièrement personnalisée ? `filterFn`.

## Configuration : `DataListConfig`
| Propriété | Rôle |
|---|---|
| `title`, `subtitle` | En-tête (`explanation` / `explanationTrigger` : ⓘ sur le titre) |
| `columns` | Colonnes ([data-list-table](data-list-table.md)) |
| `sortFields` | Options de la barre de tri |
| `stats`, `showDefaultCountCard` | Cartes de statistiques ([data-list-stats](data-list-stats.md)) ; la carte « total » est affichée par défaut |
| `actions`, `showActions` | Actions par ligne (menu) → `actionClick` |
| `showCheckbox`, `selectedButtonLabel`, `selectedButtonIcon` | Sélection de lignes → bouton d'action → `selectionAction` |
| `toolbarButtons` | Boutons de la barre d'outils → `toolbarAction(id)` |
| `pageSize`, `isAutoPagination`, `totalCount` | Pagination |
| `defaultViewMode` | `'table'` ou `'card'` (cartes automatiques sur mobile) |
| `layoutMode` | `'full'` · `'compact'` · `'invoice'` |
| `isInOnglet` | Adapte la mise en page quand la liste est dans un onglet |
| `localMode`, `isAutoSorted`, `isAutoFiltered`, `filterFn` | Voir ci-dessus |

## Événements
| Événement | Contenu |
|---|---|
| `filterApply` | `Record<champ, valeur>` — filtres actifs (`{}` = tous retirés) |
| `sortChange` | `SortState[]` |
| `pageChange` | `{ start, end, page, pageSize }` |
| `actionClick` | `{ actionId, row }` |
| `selectionAction` | Lignes sélectionnées |
| `toolbarAction` | `id` du bouton |
| `exportFetchPage` | Demande d'une page pour un export **serveur** ([data-list-export-modal](data-list-export-modal.md)) |

## Export
Bouton « Exporter » → [data-list-export-modal](data-list-export-modal.md) : CSV, Excel, PDF, XML, JSON. Sécurité : valeurs échappées (PDF) et protégées contre l'**injection de formule** (CSV/Excel : `=`, `+`, `-`, `@` préfixés d'une apostrophe).

## Accessibilité
Tableau sémantique (`<th>`, `aria-sort`), boutons de tri/filtre **nommés par colonne**, valeurs cliquables en `role="button"` avec `tabindex` et `aria-pressed`, panneaux de filtre en `role="dialog"`. À votre charge : titres de colonnes explicites.

## Pièges
* Passez un **nouveau tableau** dans `[data]` quand les données changent.
* `filterOnClick` et `filterable` n'ont d'effet visible que si le filtrage est **local** ou si vous traitez `filterApply`.
* Les clés des filtres sont les **attributs** (`name`, `boutique.nom`…) : c'est ce que reçoit `filterApply`.
* En mode manuel, ne modifiez pas `data` en place : fournissez un nouveau tableau.
