import { Directive, InjectionToken, Provider, Type, input, output } from '@angular/core';
import { FormFieldConfig } from '../models/form-builder.model';

/**
 * Contrat commun des composants de champ (intégrés ou personnalisés).
 * Un composant personnalisé n'a qu'à déclarer ces entrées/sorties (signals ou décorateurs) :
 *
 * ```ts
 * @Component({ selector: 'app-rating', standalone: true, template: `…` })
 * export class RatingFieldComponent extends ArtFieldBase { … this.valueChange.emit(4); }
 * provideArtFieldType('rating', RatingFieldComponent)
 * ```
 */
@Directive()
export abstract class ArtFieldBase {
  readonly config = input.required<FormFieldConfig>();
  readonly value = input<any>(undefined);
  /** `id` à poser sur le contrôle principal (association avec `<label for>`). */
  readonly inputId = input<string>('');
  readonly readonly = input(false);
  readonly invalid = input(false);
  /** `id` de l'élément qui décrit le champ (erreurs) pour `aria-describedby`. */
  readonly describedBy = input<string | null>(null);
  readonly compact = input(false);
  readonly valueChange = output<any>();
  readonly blurred = output<void>();
}

export interface ArtFieldTypeRegistration {
  type: string;
  component: Type<unknown>;
}

export const ART_FIELD_TYPES = new InjectionToken<ArtFieldTypeRegistration[]>('ART_FIELD_TYPES');

/** Enregistre un type de champ personnalisé : `providers: [provideArtFieldType('rating', RatingFieldComponent)]`. */
export function provideArtFieldType(type: string, component: Type<unknown>): Provider {
  return { provide: ART_FIELD_TYPES, useValue: { type, component } satisfies ArtFieldTypeRegistration, multi: true };
}

/** Palette de couleurs de marque proposée par défaut dans tous les champs `color`. */
export const ART_COLOR_PALETTE = new InjectionToken<string[]>('ART_COLOR_PALETTE', { providedIn: 'root', factory: () => [] });
