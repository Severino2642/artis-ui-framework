import { ChangeDetectionStrategy, Component, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

/** 2ᵉ niveau de modale — retourne son résultat par `@Output() closed` (autre contrat supporté). */
@Component({
  selector: 'demo-address',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <label>Adresse
      <input [ngModel]="value()" (ngModelChange)="value.set($event)" placeholder="12 rue de la Paix, Paris" />
    </label>
    <div class="actions">
      <button type="button" (click)="cancelled.emit()">Annuler</button>
      <button type="button" class="primary" [disabled]="!value()" (click)="closed.emit(value())">Valider</button>
    </div>`,
  styles: [`
    :host { display: flex; flex-direction: column; gap: var(--art-space-3); }
    label { display: flex; flex-direction: column; gap: var(--art-space-1); font-weight: var(--art-weight-semibold); font-size: var(--art-text-sm); }
    input { padding: var(--art-space-2) var(--art-space-3); font: inherit; border: var(--art-border-width) solid var(--art-border-strong); border-radius: var(--art-radius-md); background: var(--art-surface); color: var(--art-text); }
    .actions { display: flex; justify-content: flex-end; gap: var(--art-space-2); }
    button { padding: var(--art-space-2) var(--art-space-4); font: inherit; font-weight: var(--art-weight-semibold); border-radius: var(--art-radius-md); border: var(--art-border-width) solid var(--art-border-strong); background: var(--art-surface); color: var(--art-text); cursor: pointer; }
    button.primary { background: var(--art-primary); color: var(--art-on-primary); border-color: var(--art-primary); }
    button:disabled { opacity: .5; }
  `],
})
export class AddressComponent {
  readonly closed = output<string>();
  readonly cancelled = output<void>();
  protected readonly value = signal('');
}
