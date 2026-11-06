# `art-color-field` — sélecteur de couleur

## À quoi ça sert
Choisir une couleur avec **aperçu**, **code hexadécimal éditable** et **sélecteur avancé** (zone saturation/luminosité, teinte, saisie RVB et TSL, palette de marque). Valeur toujours `#RRGGBB` (majuscules), émise **en temps réel** pendant la sélection.

**Sélecteur** `art-color-field` · **Import** `ArtColorFieldComponent` · Se règle depuis `art-form-field` avec `type: 'color'`.

## Démarrage rapide
```ts
{ name: 'brand', label: 'Couleur de marque', type: 'color', defaultValue: '#EA580C',
  colorPalette: ['#EA580C', '#0E7490', '#15803D'], explanation: 'Utilisée dans les e-mails.' }
```
Palette commune à toute l'application : `{ provide: ART_COLOR_PALETTE, useValue: ['#EA580C', '#1C1917'] }`.

<!-- API:art-color-field -->
Source : `ui/src/lib/form/fields/color-field.component.ts`<!-- /API -->

## Fonctionnement
| Élément | Comportement |
|---|---|
| Pastille | Aperçu de la couleur ; ouvre le sélecteur (`aria-haspopup="dialog"`) |
| Champ hex | Saisie manuelle : accepte `#rgb`, `#rrggbb`, `rgb(r,g,b)`, `hsl(h,s%,l%)`. Valide → émise ; invalide → message `role="alert"` sans émission |
| Zone S/V | Glisser pour choisir saturation (→) et luminosité (↑) — complément à la souris |
| Curseur teinte | `<input type="range">` 0–360° (clavier : flèches) |
| RVB / TSL | Champs numériques liés ; modifient la couleur instantanément |
| Palette | Pastilles cliquables (`colorPalette` du champ, sinon `ART_COLOR_PALETTE`) |
| Fermeture | Échap (focus rendu au bouton), clic extérieur, bouton « Fermer » |

Le panneau s'affiche en **couche supérieure** : il n'est jamais rogné ni décalé par un conteneur `overflow`/`transform`.

## Accessibilité
Toutes les valeurs sont saisissables **au clavier** (hex, RVB, TSL, palette, teinte). Panneau `role="dialog"`. Les textes sont traduisibles (`color.*` dans [i18n](../modules/i18n.md)).

## Pièges
* Pas de canal alpha.
* Le spectre de teinte du curseur est le seul élément non thémable.
