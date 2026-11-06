# `art-form-builder` — formulaire piloté par configuration

## À quoi ça sert
Construire un formulaire complet (sections repliables, champs typés, validation, boutons, **formulaire tableau** de lignes enfants) à partir d'**un objet de configuration**. Gère l'état, la validation et les boutons *Réinitialiser / Enregistrer*.

**Sélecteur** `art-form-builder` · **Import** `ArtFormBuilderComponent`

## Démarrage rapide
```ts
@Component({
  standalone: true, imports: [ArtFormBuilderComponent],
  template: `<art-form-builder [config]="config" (formAction)="onAction($event)" />`,
})
export class ClientForm {
  config: FormConfig = {
    sections: [{
      title: 'Identité', icon: 'badge',
      explanation: 'Visible sur **toutes** les factures.',
      fields: [
        { name: 'name',  label: 'Raison sociale', type: 'text',  colSpan: 6, required: true,
          validation: { validators: [{ type: 'required' }, { type: 'minLength', length: 3 }] } },
        { name: 'email', label: 'E-mail',          type: 'text',  colSpan: 6,
          validation: { validators: [{ type: 'email' }] } },
        { name: 'brand', label: 'Couleur',         type: 'color', colSpan: 4 },
      ],
    }],
  };

  onAction(e: FormActionEvent) {
    if (e.buttonId === 'save') this.api.post('/clients', e.parentValues).subscribe();
  }
}
```
Si un champ est invalide, *Enregistrer* n'émet rien et affiche un toast d'avertissement.

<!-- API:art-form-builder -->
Source : `ui/src/lib/form/form-builder/form-builder.component.ts`
**Entrées**

| Nom | Type | Défaut | Rôle |
|---|---|---|---|
| `config` | `FormConfig` | — | — |
| `childConfig` | `ChildFormConfig` | — | — |
| `isEditMode` | `boolean` | `false` | — |
| `initialValues` | `Record<string, any>` | — | Pre-populate parent form values (for edit mode) |
| `initialChildRows` | `Record<string, any>[]` | — | Pre-populate child rows (for edit mode) |

**Sorties (événements)**

| Nom | Type | Rôle |
|---|---|---|
| `formAction` | `FormActionEvent` | — |
| `fieldButtonClick` | `FieldButtonEvent` | Emitted when a field-level button is clicked |
| `childFieldButtonClick` | `FieldButtonEvent & { rowIndex: number }` | Emitted when a child-level field button is clicked |
<!-- /API -->

## Configuration

### `FormConfig`
| Propriété | Rôle |
|---|---|
| `sections: FormSectionConfig[]` | Sections du formulaire mère |
| `extraButtons?: ActionButtonConfig[]` | Boutons d'action supplémentaires en pied |

### `FormSectionConfig`
| Propriété | Défaut | Rôle |
|---|---|---|
| `title` | — | Titre |
| `subtitle` | — | Sous-titre |
| `icon` | — | Icône Material |
| `fields` | — | Champs de la section ([form-field](form-field.md)) |
| `collapsed` | `false` | Section repliée au départ |
| `explanation`, `explanationTrigger` | — | ⓘ à côté du titre |

### `ActionButtonConfig`
`{ id, label, icon?, variant?: 'default'|'primary'|'danger'|'success', cssClass? }` — un clic émet `formAction` avec `buttonId = id`. Les identifiants `save` et `reset` sont ceux des boutons intégrés.

### Événements
| Événement | Contenu |
|---|---|
| `formAction` | `{ buttonId, parentValues, childValues }` (`childValues` = lignes du formulaire tableau, uniquement les lignes **modifiées/cochées**) |
| `fieldButtonClick` | `{ buttonId, fieldName, currentFieldValue, allFormValues }` — bouton attaché à un champ (`buttons` du champ) |
| `childFieldButtonClick` | idem + `rowIndex` (champ d'une ligne du formulaire tableau) |

## Méthodes publiques (via `@ViewChild`)
| Méthode | Rôle |
|---|---|
| `setFieldValue(name, value)` | Définit la valeur d'un champ (et le revalide) |
| `setFieldOption(name, [{ value, label }])` | Remplace les options d'un `select`/`multiselect` |
| `setFieldDefaultValues(name, value)` | Change la valeur par défaut **et** la valeur |

## Exemples

### Mode édition avec valeurs initiales
```html
<art-form-builder [config]="config" [initialValues]="client" [isEditMode]="true" />
```
### Formulaire mère + formulaire tableau
```html
<art-form-builder [config]="config" [childConfig]="linesConfig" [initialChildRows]="client.lines" (formAction)="save($event)" />
```
`linesConfig` est un `ChildFormConfig` : voir [form-child](form-child.md).
### Bouton « + » sur un champ → modale
Voir [modal](../modules/modal.md) (cas « créer un client depuis une vente »).

## Accessibilité
Libellés reliés aux contrôles (`for`/`id`), erreurs en `role="alert"` reliées par `aria-describedby`, `aria-invalid`, sections avec bouton de repli (`aria-expanded`), focus visible. À votre charge : des `label` explicites sur chaque champ.

## Pièges
* `colSpan` suit une grille de 12 colonnes (défaut 4) fournie par `@artis/theme` (`utilities.css`).
* Modifiez la configuration par **nouvelle référence** (`this.config = { ...this.config }`) pour forcer un re-rendu complet.
* Dans une application zoneless, appelez `setFieldValue` depuis un gestionnaire d'événement ou après une `await` (la méthode marque déjà le composant).
