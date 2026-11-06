# `art-dl-sort` — barre de tri

## À quoi ça sert
Liste déroulante « Trier par » de la [data-list](data-list.md) : choisir un champ et un sens. Synchronisée avec les icônes de tri des en-têtes de colonnes.

**Sélecteur** `art-dl-sort` · **Import** `ArtDataListSortComponent`

## Démarrage rapide
Dans la configuration de la liste :
```ts
sortFields: [
  { key: 'name',  label: 'Nom', explanation: 'Ordre alphabétique.' },
  { key: 'price', label: 'Prix' },
  { key: 'date',  label: 'Date de création' },
],
```
`key` est le **chemin de la valeur** dans chaque ligne (`'customer.name'`).

<!-- API:art-dl-sort -->
Source : `ui/src/lib/list/data-list-sort/data-list-sort.component.ts`
**Entrées**

| Nom | Type | Défaut | Rôle |
|---|---|---|---|
| `fields` | `SortField[]` | `[]` | — |
| `isMobile` | `any` | `false` | — |
| `activeSorts` | `SortState[] \| null \| undefined` | — | Tris actifs posés de l'extérieur (ex. clic sur un en-tête de colonne) : la barre reste synchronisée. |

**Sorties (événements)**

| Nom | Type | Rôle |
|---|---|---|
| `sortChange` | `SortState[]` | — |
<!-- /API -->

## Fonctionnement
* Un clic sur un champ : croissant → décroissant → retiré.
* `activeSorts` (posé par la liste) maintient la barre à jour quand le tri vient d'un en-tête.
* En [mode local](data-list.md) le tri est appliqué par le framework ; sinon écoutez `sortChange`.

## Pièges
* `sortFields[].key` doit correspondre au chemin réel des données (ou au `sortKey` de la colonne) pour que l'indicateur d'en-tête et la barre restent synchronisés.
