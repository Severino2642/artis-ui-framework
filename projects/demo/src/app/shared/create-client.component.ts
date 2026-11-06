import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '@artis/api';
import { ModalRef, ModalService } from '@artis/ui';
import { ToastService } from '@artis/toaster';
import { AddressComponent } from './address.component';

export interface Client { id: number; name: string; email: string; address?: string }

/** Composant ouvert EN MODALE : récupère `ModalRef` par injection et retourne le client créé via `ref.close(client)`. */
@Component({
  selector: 'demo-create-client',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="form">
      <label>Nom <input name="name" [ngModel]="name()" (ngModelChange)="name.set($event)" data-art-autofocus /></label>
      <label>E-mail <input name="email" type="email" [ngModel]="email()" (ngModelChange)="email.set($event)" /></label>
      <p class="addr">
        Adresse : <strong>{{ address() || '—' }}</strong>
        <button type="button" class="link" (click)="pickAddress()">Choisir (2ᵉ modale)</button>
      </p>
      <div class="actions">
        <button type="button" (click)="ref.dismiss()">Annuler</button>
        <button type="button" class="primary" [disabled]="!name() || !email() || saving()" (click)="save()">Créer le client</button>
      </div>
    </div>`,
  styles: [`
    .form { display: flex; flex-direction: column; gap: var(--art-space-3); }
    label { display: flex; flex-direction: column; gap: var(--art-space-1); font-weight: var(--art-weight-semibold); font-size: var(--art-text-sm); }
    input { padding: var(--art-space-2) var(--art-space-3); font: inherit; border: var(--art-border-width) solid var(--art-border-strong); border-radius: var(--art-radius-md); background: var(--art-surface); color: var(--art-text); }
    .actions { display: flex; justify-content: flex-end; gap: var(--art-space-2); }
    button { padding: var(--art-space-2) var(--art-space-4); font: inherit; font-weight: var(--art-weight-semibold); border-radius: var(--art-radius-md); border: var(--art-border-width) solid var(--art-border-strong); background: var(--art-surface); color: var(--art-text); cursor: pointer; }
    button.primary { background: var(--art-primary); color: var(--art-on-primary); border-color: var(--art-primary); }
    button:disabled { opacity: .5; cursor: not-allowed; }
    .link { border: 0; background: none; color: var(--art-primary); text-decoration: underline; padding: 0 var(--art-space-2); }
  `],
})
export class CreateClientComponent {
  protected readonly ref = inject<ModalRef<Client>>(ModalRef);
  private readonly api = inject(ApiService);
  private readonly modal = inject(ModalService);
  private readonly toast = inject(ToastService);

  /** Reçu via `inputs` de `ModalConfig`. */
  readonly defaultName = input('');

  protected readonly name = signal('');
  protected readonly email = signal('');
  protected readonly address = signal('');
  protected readonly saving = signal(false);

  ngOnInit(): void { this.name.set(this.defaultName()); }

  protected async pickAddress(): Promise<void> {
    const a = await this.modal.open<AddressComponent, string>({ component: AddressComponent, title: 'Adresse', size: 'sm' });
    if (a) this.address.set(a);
  }

  protected save(): void {
    this.saving.set(true);
    this.api.post<Client>('/clients', { name: this.name(), email: this.email() }).subscribe({
      next: (c) => { this.toast.success(`Client « ${c.name} » créé`); this.ref.close({ ...c, address: this.address() || undefined }); },
      error: () => this.saving.set(false),
    });
  }
}
