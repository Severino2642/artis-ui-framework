# `art-dl-column-filter` — filtre d'une colonne

## À quoi ça sert
Une icône dans l'en-tête de colonne ouvre un petit panneau pour filtrer **cette colonne** en un clic. Activé par `filterable` sur la colonne ; utilisé automatiquement par [data-list-table](data-list-table.md).

**Sélecteur** `art-dl-column-filter` · **Import** `ArtDataListColumnFilterComponent`

## Démarrage rapide
```ts
{ key: 'price',  title: 'Prix',   filterable: true, sections: [...] }                          // intervalle min/max déduit
{ key: 'status', title: 'Statut', filterable: { type: 'select', options: [{ value: 'a', label: 'Actif' }] }, sections: [...] }  // personnalisé
```
Pas de balise à écrire : l'icône apparaît dans l'en-tête.

<!-- API:art-dl-column-filter -->
Source : `ui/src/lib/list/data-list-column-filter/data-list-column-filter.component.ts`
**Entrées**

| Nom | Type | Défaut | Rôle |
|---|---|---|---|
| `field` | `FormFieldConfig` | **requis** | Champ de filtre (type, options…). |
| `value` | `unknown` | `null` | Valeur actuellement appliquée (pour l'état « actif » et le pré-remplissage). |
| `label` | `inféré` | `''` | Titre de la colonne (nom accessible du bouton). |

**Sorties (événements)**

| Nom | Type | Rôle |
|---|---|---|
| `applied` | `unknown` | — |
<!-- /API -->

## Champ déduit (`filterable: true`)
Texte → zone de texte · nombre → intervalle min/max · date → intervalle de dates · badge → liste. `filterable: { … }` fusionne vos options par-dessus (`type`, `options`, `placeholder`, `filterMatch`, `label`…).

## Fonctionnement
| Action | Effet |
|---|---|
| Clic sur l'icône | Ouvre le panneau (couche supérieure : jamais rogné) |
| Entrée ou « Appliquer » | Applique le filtre ; l'icône passe en état **actif** |
| « Effacer » | Retire le filtre de la colonne |
| Échap / clic extérieur | Ferme (Échap rend le focus à l'icône) |

Le filtre est ajouté aux filtres actifs de la [data-list](data-list.md) (même état que le panneau de filtres).

## Accessibilité
Bouton `aria-haspopup="dialog"`, `aria-expanded`, nom « Filtrer la colonne X » (traduisible : `list.filterColumn`) ; panneau `role="dialog"` ; focus placé sur le champ à l'ouverture.

## Pièges
* La valeur appliquée est la **clé du champ** = premier attribut de la colonne (ou `filterable.name`).
