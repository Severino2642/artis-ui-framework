# `art-form-field` — un champ, tous les types

## À quoi ça sert
Afficher **un champ** de formulaire selon son type, avec libellé, astérisque « requis », explication ⓘ, validation (synchrone et asynchrone), messages d'erreur et boutons rattachés. C'est la brique utilisée par [form-builder](form-builder.md) et [form-child](form-child.md) ; utilisable seule.

**Sélecteur** `art-form-field` · **Import** `ArtFormFieldComponent`

## Démarrage rapide
```html
<art-form-field [config]="{ name: 'email', label: 'E-mail', type: 'text', required: true,
                            validation: { validators: [{ type: 'required' }, { type: 'email' }] } }"
                [value]="email" (valueChange)="email = $event" />
```

<!-- API:art-form-field -->
Source : `ui/src/lib/form/form-field/form-field.component.ts`
**Entrées**

| Nom | Type | Défaut | Rôle |
|---|---|---|---|
| `config` | `FormFieldConfig` | **requis** | — |
| `value` | `any` | `undefined` | — |
| `compact` | `any` | `false` | When true: no label, compact sizing (used inside child table rows) |
| `formValues` | `Record<string, any>` | `{}` | All current sibling field values — forwarded in button events |

**Sorties (événements)**

| Nom | Type | Rôle |
|---|---|---|
| `valueChange` | `any` | — |
| `buttonClick` | `FieldButtonEvent` | — |
<!-- /API -->

## Types de champ
| `type` | Rendu | Valeur | Options spécifiques |
|---|---|---|---|
| `text` | Zone de texte | `string` | `placeholder`, `customProperties` |
| `number` | Nombre | `number` | `customProperties="min='0' max='100' step='5'"` |
| `date` · `time` · `datetime` | Sélecteur natif | `string` ISO | — |
| `textarea` | Texte multiligne | `string` | — |
| `select` | Liste déroulante | valeur de l'option | `options`, `optionValueKey`, `optionLabelKey` |
| `multiselect` | Liste à choix multiples (puces) | tableau | `options`… |
| `autocomplete` | Recherche avec suggestions | valeur choisie | `autocompleteData` (tableau **ou URL**), `autocompleteDisplayKeys` (`"nom;ville"`), `autocompleteSearchParam` (`q`) |
| `interval` | Deux bornes | `{ min, max }` | `intervalBaseType: 'number' \| 'date' \| …` |
| `color` | Aperçu + hex + sélecteur avancé | `'#RRGGBB'` | `colorPalette` → [color-field](color-field.md) |
| `secret` | Valeur masquée, copie, œil | `string` | `secret*` → [secret-field](secret-field.md) |
| `file` | Envoi de fichiers | `ArtFileValue` / `ArtFileValue[]` | `file*` → [file-field](file-field.md) |
| *votre type* | Votre composant | libre | [field-registry](../modules/field-registry.md) |

Sans `type`, il est **déduit** de `defaultValue` : nombre → `number`, booléen → `select` (Vrai/Faux), `Date` → `date`, sinon `text`. Pour tous les autres types, indiquez `type`.

## Options communes (`FormFieldConfig`)
| Option | Rôle |
|---|---|
| `name` | Clé de la valeur (obligatoire) |
| `label` | Libellé (défaut : `name`) |
| `required` | Astérisque + impose une valeur |
| `defaultValue` | Valeur initiale |
| `visible` | `false` masque le champ |
| `isReadOnly` | Lecture seule |
| `colSpan` | Largeur sur 12 colonnes (défaut 4) |
| `validation` | `{ validators: [...], stopOnFirstError? }` ([services](../modules/services.md)) |
| `buttons` | Boutons rattachés : `{ id, icon, label?, tooltip?, variant? }` → événement `fieldButtonClick` du formulaire |
| `explanation`, `explanationTrigger` | Bulle ⓘ à côté du libellé (clic ou survol) |
| `customProperties` | Attributs HTML bruts sur l'`<input>` (`"min='0' step='5'"`) — gestionnaires `on*` et `javascript:` **refusés** |
| `filterAttribute`, `filterMatch` | Pour le filtrage local d'une liste ([data-list](data-list.md)) |

## Validation
Déclenchée à la perte de focus et à la sauvegarde. Validateurs : `required`, `minLength`, `maxLength`, `min`, `max`, `pattern`, `email`, `url`, `custom` (sync ou **async**, avec un indicateur de chargement dans le libellé). Un champ optionnel **vide** est valide (seuls `required` et `custom` s'évaluent). Chaque validateur accepte `message`.

```ts
validation: { validators: [
  { type: 'required', message: 'Obligatoire' },
  { type: 'custom', asyncFn: async (v) => (await this.api.getAsync<boolean>(`/exists?name=${v}`)) ? 'Déjà pris' : null },
] }
```

## Accessibilité
`<label for>` relié au contrôle par un `id` unique, `aria-invalid`, `aria-describedby` vers le message (`role="alert"`), astérisque `aria-hidden`, ⓘ avec nom accessible ; autocomplete en `role="combobox"`.

## Pièges
* L'ancien `<input type="color">` natif n'existe plus : `type: 'color'` utilise le nouveau sélecteur.
* `options` d'un `select` : objets avec `optionValueKey`/`optionLabelKey` (défaut `value`/`label`).
* L'autocomplete par URL appelle `ApiService` (jeton, erreurs, annulation de la requête précédente à chaque frappe).
