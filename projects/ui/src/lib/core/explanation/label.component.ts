import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ArtInfoTipComponent } from './info-tip.component';

/**
 * Libellé avec explication contextuelle optionnelle.
 * Utilisable partout où l'UI affiche une étiquette : champ, colonne, section, carte, filtre…
 *
 * ```html
 * <art-label text="Numéro de TVA" explanation="Format **FR** + 11 chiffres. [Aide](https://…)" />
 * ```
 * Avec `for`, le texte est rendu dans un `<label for>` (association au champ).
 */
@Component({
  selector: 'art-label',
  standalone: true,
  imports: [ArtInfoTipComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (for()) {
      <label class="art-label__text" [attr.for]="for()">{{ text() }}@if (required()) {<span class="art-label__req" aria-hidden="true">*</span>}</label>
    } @else {
      <span class="art-label__text">{{ text() }}@if (required()) {<span class="art-label__req" aria-hidden="true">*</span>}</span>
    }
    @if (explanation()) {
      <art-info-tip [text]="explanation()!" [label]="text()" [trigger]="trigger()" />
    }
  `,
  styles: [`
    :host { display: inline-flex; align-items: center; gap: var(--art-space-1); min-width: 0; }
    .art-label__text { min-width: 0; }
    .art-label__req { margin-left: var(--art-space-0-5); color: var(--art-danger); }
  `],
})
export class ArtLabelComponent {
  readonly text = input.required<string>();
  readonly explanation = input<string | null | undefined>(null);
  readonly required = input(false);
  /** `id` du contrôle associé : le texte devient un `<label for>`. */
  readonly for = input<string | null>(null);
  readonly trigger = input<'click' | 'hover'>('click');
}
