# `art-form-child` — formulaire tableau (lignes)

## À quoi ça sert
Saisir **plusieurs lignes** de même structure (lignes de facture, contacts…) : affichage en tableau ou en cartes, ajout/suppression de lignes, validation par cellule. Utilisé par [form-builder](form-builder.md) via `childConfig`, ou seul.

**Sélecteur** `art-form-child` · **Import** `ArtFormChildComponent`

## Démarrage rapide
```ts
linesConfig: ChildFormConfig = {
  title: 'Lignes de vente', icon: 'list_alt',
  explanation: 'Une ligne par produit vendu.',
  bulkAddCount: 10, maxRows: 200,
  fields: [
    { name: 'product', label: 'Produit', type: 'text', required: true, explanation: 'Désignation affichée sur la facture.' },
    { name: 'qty',     label: 'Quantité', type: 'number', defaultValue: 1 },
    { name: 'price',   label: 'Prix', type: 'number' },
  ],
};
```
```html
<art-form-child [config]="linesConfig" [rows]="lines" (rowsChange)="lines = $event" />
```

<!-- API:art-form-child -->
Source : `ui/src/lib/form/form-child/form-child.component.ts`
**Entrées**

| Nom | Type | Défaut | Rôle |
|---|---|---|---|
| `config` | `ChildFormConfig` | **requis** | — |
| `rows` | `Record<string, any>[]` | `[]` | — |
| `footerConfig` | `FormFooterConfig` | — | Quand fourni, un footer avec les boutons d'action est rendu dans fc-wrapper |

**Sorties (événements)**

| Nom | Type | Rôle |
|---|---|---|
| `rowsChange` | `Record<string, any>[]` | — |
| `buttonClick` | `{ buttonId: string; rows: Record<string, any>[] }` | — |
| `fieldButtonClick` | `FieldButtonEvent & { rowIndex: number }` | — |
| `footerAction` | `string` | — |
<!-- /API -->

## Boutons d'action : en-tête **et** pied, identiques
Les mêmes actions sont proposées **au-dessus** et **en dessous** du tableau (une seule définition, donc comportement identique) :

| Bouton | Visible | Effet |
|---|---|---|
| **Supprimer (n)** | si au moins une ligne est cochée | Supprime les lignes cochées |
| **Ajouter N lignes** | si `bulkAddCount` ≠ 0 (défaut **10**) | Ajoute N lignes vierges **en une seule émission** |
| **Ajouter une ligne** | toujours | Ajoute une ligne vierge |

Le pied n'apparaît que lorsqu'il y a au moins une ligne (inutile de dupliquer le bouton d'un tableau vide). Il affiche `n / maxRows` si `maxRows` est défini.

## `ChildFormConfig`
| Propriété | Défaut | Rôle |
|---|---|---|
| `title`, `subtitle`, `icon` | — | En-tête |
| `fields` | — | Colonnes ([form-field](form-field.md)) ; `label` et `explanation` s'affichent en en-tête de colonne |
| `defaultViewMode` | `'table'` | `'table'` ou `'card'` (cartes automatiques sur mobile) |
| `extraButtons` | — | Boutons supplémentaires dans l'en-tête |
| `bulkAddCount` | `10` | Lignes ajoutées par « Ajouter N lignes » ; `0` masque le bouton |
| `maxRows` | — | Limite de lignes : boutons désactivés à la limite, ajout groupé tronqué |
| `explanation`, `explanationTrigger` | — | ⓘ à côté du titre |

## Méthodes publiques
`addRow()`, `addRows(n)` (respecte `maxRows`), `removeRow(i)`, `removeSelected()`, `toggleRowSelection(i)`, `getRowsWithSatutSelected()`.

## Lignes « cochées » = lignes modifiées
Modifier une cellule **coche** la ligne (elle est marquée `selected`) : `formAction.childValues` du form-builder ne transmet que les lignes cochées/modifiées. Les valeurs par défaut (`defaultValue`) sont appliquées **avant** le rendu et ne cochent pas la ligne.

## Accessibilité
Boutons à nom explicite (« Ajouter 10 lignes ») ; cases à cocher par ligne ; en-têtes de colonnes avec ⓘ accessible.

## Pièges
* Passez un **nouveau tableau** dans `[rows]` quand vous remplacez les données.
* Un appel programmatique (`ViewChild`) est pris en compte même en mode zoneless (le composant se marque lui-même).
