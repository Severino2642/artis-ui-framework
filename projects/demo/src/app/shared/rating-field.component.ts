import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ArtFieldBase } from '@artis/ui';

/** Exemple de type de champ PERSONNALISÉ : `provideArtFieldType('rating', RatingFieldComponent)`. */
@Component({
  selector: 'demo-rating-field',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div role="radiogroup" [attr.aria-label]="config().label ?? config().name" [attr.aria-describedby]="describedBy()" class="stars">
      @for (n of [1,2,3,4,5]; track n) {
        <button type="button" role="radio" [attr.aria-checked]="value() === n" [attr.aria-label]="n + ' / 5'" [disabled]="readonly()"
                [class.on]="(value() ?? 0) >= n" (click)="valueChange.emit(n)" (blur)="blurred.emit()">★</button>
      }
    </div>`,
  styles: [`
    .stars { display: flex; gap: var(--art-space-1); }
    button { padding: 0; font-size: var(--art-text-2xl); line-height: 1; color: var(--art-border-strong); background: none; border: 0; cursor: pointer; }
    button.on { color: var(--art-warning-light); }
  `],
})
export class RatingFieldComponent extends ArtFieldBase {}
