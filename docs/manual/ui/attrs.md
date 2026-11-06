# `[artAttrs]` — attributs HTML depuis une chaîne

## À quoi ça sert
Appliquer sur un élément des attributs décrits dans une **chaîne de configuration** (`customProperties` d'un champ) : `"min='0' max='100' step='5' readonly"`.

**Sélecteur** `[artAttrs]` · **Import** `ArtAttrsDirective`

## Démarrage rapide
```html
<input [artAttrs]="field.customProperties" />
```
Dans une configuration : `{ name: 'qty', type: 'number', customProperties: "min='0' max='100' step='5'" }`.

<!-- API:[artAttrs] -->
Source : `ui/src/lib/form/attrs/attrs.directive.ts`<!-- /API -->

## Syntaxe
`nom='valeur'`, `nom="valeur"` ou attribut booléen seul (`readonly`). Plusieurs attributs séparés par des espaces.

## Sécurité
La chaîne vient d'une **configuration** ; ne la construisez jamais à partir d'une saisie utilisateur. Sont **refusés** : tout attribut `on…` (`onclick`, `onfocus`…), `srcdoc`, `formaction`, et toute valeur `javascript:`.

## Pièges
* Pour `type`, `required`, `readonly`, `placeholder`, préférez les options dédiées de `FormFieldConfig`.
