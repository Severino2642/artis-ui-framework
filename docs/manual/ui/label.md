# `art-label` — libellé avec explication

## À quoi ça sert
Afficher un texte d'étiquette avec, **à côté**, une icône ⓘ qui ouvre une explication contextuelle. À utiliser partout où l'interface affiche une étiquette que le framework ne gère pas déjà (titre de votre composant, en-tête perso…).

**Sélecteur** `art-label` · **Import** `ArtLabelComponent`

## Démarrage rapide
```html
<art-label text="Numéro de TVA" explanation="Format **FR** + 11 chiffres. [Aide](https://exemple.com/tva)" />

<!-- relié à un champ -->
<art-label text="Nom" for="champ-nom" [required]="true" explanation="Nom légal." />
<input id="champ-nom" />
```

<!-- API:art-label -->
Source : `ui/src/lib/core/explanation/label.component.ts`
**Entrées**

| Nom | Type | Défaut | Rôle |
|---|---|---|---|
| `text` | `string` | **requis** | — |
| `explanation` | `string \| null \| undefined` | `null` | — |
| `required` | `inféré` | `false` | — |
| `for` | `string \| null` | `null` | `id` du contrôle associé : le texte devient un `<label for>`. |
| `trigger` | `'click' \| 'hover'` | `'click'` | — |
<!-- /API -->

## Où le framework l'utilise déjà
Libellé de champ ([form-field](form-field.md)), titre de section ([form-builder](form-builder.md)), titre et colonnes du [form-child](form-child.md), en-têtes de [data-list-table](data-list-table.md), titre de liste, [stats](data-list-stats.md), puces de [filtre](data-list-filter.md), titre/colonnes/champs de [detail-card](detail-card.md). Dans chacun, il suffit de renseigner `explanation` (et `explanationTrigger`) dans la configuration.

## Syntaxe de l'explication
Voir [markdown-lite](markdown-lite.md) : `**gras**`, `*italique*`, `[lien](https://…)`, retour à la ligne.

## Accessibilité
Avec `for`, le texte devient un `<label for>` relié au contrôle ; l'étoile « requis » est `aria-hidden` ; le bouton ⓘ est nommé « Afficher l'explication : <libellé> ».

## Pièges
* L'icône ⓘ est un **bouton** : ne placez pas `art-label` à l'intérieur d'un autre bouton ou lien.
