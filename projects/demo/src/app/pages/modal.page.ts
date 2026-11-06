import { ChangeDetectionStrategy, Component, ViewChild, signal } from '@angular/core';
import { ArtFormBuilderComponent, FieldButtonEvent, FormActionEvent, FormConfig, ModalService } from '@artis/ui';
import { CreateClientComponent, Client } from '../shared/create-client.component';

/** Cas d'usage cible : bouton « + » à côté du champ client → modale de création → retour du client créé, sans quitter la page. */
@Component({
  selector: 'demo-modal-page',
  standalone: true,
  imports: [ArtFormBuilderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './page.css',
  template: `
    <h1>Modale générique</h1>
    <p class="lead">Formulaire de vente : le bouton <strong>+</strong> du champ « Client » ouvre un composant de création dans une modale (2ᵉ niveau imbriqué pour l'adresse). Le client créé revient au formulaire.</p>
    <art-form-builder #form [config]="config" (formAction)="onAction($event)" (fieldButtonClick)="onFieldButton($event)" />
    @if (result()) { <pre>{{ result() }}</pre> }
  `,
})
export class ModalPage {
  @ViewChild('form') form!: ArtFormBuilderComponent;
  protected readonly result = signal('');
  private clients: { value: number; label: string }[] = [
    { value: 1, label: 'Acme Industries' }, { value: 2, label: 'Globex SA' }, { value: 3, label: 'Initech' },
  ];

  constructor(private readonly modal: ModalService) {}

  protected readonly config: FormConfig = {
    sections: [{
      title: 'Nouvelle vente', icon: 'point_of_sale',
      fields: [
        { name: 'product', label: 'Produit', type: 'text', colSpan: 4, required: true },
        { name: 'qty', label: 'Quantité', type: 'number', colSpan: 4, defaultValue: 1 },
        {
          name: 'client', label: 'Client', type: 'select', colSpan: 4, optionValueKey: 'value', optionLabelKey: 'label', options: [],
          explanation: 'Le client n’existe pas encore ? Utilisez le bouton **+** pour le créer sans quitter cette page.',
          buttons: [{ id: 'add-client', icon: 'add', tooltip: 'Créer un client', variant: 'primary' }],
        },
      ],
    }],
  };

  ngOnInit(): void { this.config.sections[0].fields[2].options = this.clients; }

  protected async onFieldButton(e: FieldButtonEvent): Promise<void> {
    if (e.buttonId !== 'add-client') return;
    const client = await this.modal.open<CreateClientComponent, Client>({
      component: CreateClientComponent,
      title: 'Nouveau client',
      size: 'md',
      inputs: { defaultName: '' },
    });
    if (!client) return; // fermée sans résultat
    this.clients = [...this.clients, { value: client.id, label: client.name }];
    this.form.setFieldOption('client', this.clients);
    this.form.setFieldValue('client', client.id);
  }

  protected onAction(e: FormActionEvent): void {
    if (e.buttonId === 'save') this.result.set(JSON.stringify(e.parentValues, null, 2));
  }
}
