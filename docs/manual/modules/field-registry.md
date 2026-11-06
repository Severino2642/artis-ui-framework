# Types de champ personnalisés — `provideArtFieldType`

## À quoi ça sert
Ajouter vos propres types de champ (note par étoiles, sélecteur d'icône, éditeur riche…) utilisables dans `art-form-builder`, `art-form-field` et `art-form-child` comme n'importe quel type natif.

## Démarrage rapide
```ts
@Component({
  selector: 'app-rating',
  standalone: true,
  template: `
    @for (n of [1,2,3,4,5]; track n) {
      <button type="button" [attr.aria-label]="n + ' / 5'" [disabled]="readonly()"
              (click)="valueChange.emit(n)" (blur)="blurred.emit()">{{ (value() ?? 0) >= n ? '★' : '☆' }}</button>
    }`,
})
export class RatingField extends ArtFieldBase {}      // fournit entrées et sorties du contrat

// app.config.ts
providers: [provideArtFieldType('rating', RatingField)]

// configuration d'un formulaire
{ name: 'note', type: 'rating', label: 'Satisfaction', explanation: 'De 1 à 5.' }
```

## Contrat `ArtFieldBase`
| Entrée | Rôle |
|---|---|
| `config` | `FormFieldConfig` complète du champ (vos options perso via `customProperties` ou en étendant l'interface) |
| `value` | Valeur courante |
| `inputId` | `id` à poser sur le contrôle principal (liaison avec `<label for>`) |
| `readonly` | Mode lecture seule |
| `invalid` | Le champ est en erreur |
| `describedBy` | `id` de l'élément d'erreur (`aria-describedby`) |
| `compact` | Mode sans libellé (cellule de tableau) |

| Sortie | Rôle |
|---|---|
| `valueChange` | Émettre la **nouvelle valeur** (déclenche la validation et propage au formulaire) |
| `blurred` | Émettre à la perte de focus (déclenche la validation « à la sortie ») |

## Ce que le framework fait pour vous
Libellé, `required`, explication ⓘ, validation (`validation.validators`), messages d'erreur, colonne de grille (`colSpan`), boutons rattachés au champ, lecture seule.

## `ART_COLOR_PALETTE`
Palette de couleurs de marque proposée par **tous** les champs `color` : `{ provide: ART_COLOR_PALETTE, useValue: ['#EA580C', '#0E7490'] }` (surchargée par `colorPalette` d'un champ).

## Pièges
* Le type doit être **enregistré avant** d'être utilisé (sinon le champ ne s'affiche pas).
* Votre composant n'a **pas** à afficher le libellé ni l'erreur.
* Donnez un nom accessible à vos contrôles (le libellé du formulaire est associé via `inputId`).
