# `art-dl-filter` — panneau de filtres

## À quoi ça sert
Panneau (bouton « Filtrer » de la [data-list](data-list.md)) qui regroupe des champs de filtre et émet les valeurs choisies. Sans configuration, il **déduit** un champ par colonne.

**Sélecteur** `art-dl-filter` · **Import** `ArtDataListFilterComponent`

<!-- API:art-dl-filter -->
Source : `ui/src/lib/list/data-list-filter/data-list-filter.component.ts`
**Entrées**

| Nom | Type | Défaut | Rôle |
|---|---|---|---|
| `filterConfig` | `FilterPanelConfig` | — | — |
| `columns` | `ColumnDef[]` | `[]` | Auto-génère les champs depuis les colonnes si filterConfig est absent |
| `isMobile` | `any` | `false` | — |
| `filterValues` | `Record<string, any>` | `{}` | Valeurs courantes des filtres (bindable depuis l'extérieur) |

**Sorties (événements)**

| Nom | Type | Rôle |
|---|---|---|
| `apply` | `Record<string, any>` | — |
| `reset` | `void` | — |
| `closePanel` | `void` | — |
<!-- /API -->

## Champs déduits des colonnes
| Type de la 1ʳᵉ valeur de la colonne | Champ de filtre |
|---|---|
| texte (défaut) | `text` (contient, sans accents/casse) |
| `number` | `interval` numérique (min/max) |
| `date` | `interval` de dates (min/max) |
| `badge` | `select` (options = clés de `badgeColorMap`, sinon valeurs distinctes des données) |

## Personnaliser : `FilterPanelConfig`
```ts
filterPanelConfig: FilterPanelConfig = {
  fields: [
    { name: 'status', label: 'Statut', type: 'select', options: [{ value: 'actif', label: 'Actif' }, { value: 'inactif', label: 'Inactif' }], colSpan: 4 },
    { name: 'price',  label: 'Prix', type: 'interval', intervalBaseType: 'number', colSpan: 4 },
    { name: 'q',      label: 'Recherche', type: 'text', filterAttribute: 'name', filterMatch: 'startsWith', colSpan: 4 },
  ],
};
```
```html
<art-data-list [config]="config" [data]="data" [filterPanelConfig]="filterPanelConfig" />
```
Les champs sont des [`FormFieldConfig`](form-field.md) : tous les types sont utilisables (`multiselect`, `autocomplete`, `color`…). `name` est la **clé** du filtre ; `filterAttribute` indique le chemin à comparer si différent.

## Fonctionnement
* **Appliquer** → `apply(valeurs)` ; **Réinitialiser** → `reset` ; fermer → `closePanel`.
* Un filtre posé ailleurs (icône de colonne, clic sur une valeur) **apparaît** dans le panneau.
* Le badge du bouton « Filtrer » indique le nombre de filtres actifs.
* Chaque `FormFieldConfig` du panneau accepte `explanation` (ⓘ).

## Accessibilité
Champs standard ([form-field](form-field.md)) avec libellés reliés ; panneau repliable au clavier.

## Pièges
* Deux champs de filtre avec le même `name` partagent la même valeur.
* Sans `filterPanelConfig`, les options d'un `badge` sans `badgeColorMap` sont déduites des **données reçues** (pas de la page entière en mode serveur : fournissez `options`).
