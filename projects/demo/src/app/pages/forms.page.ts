import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ArtFormBuilderComponent, FormActionEvent, FormConfig } from '@artis/ui';

@Component({
  selector: 'demo-forms-page',
  standalone: true,
  imports: [ArtFormBuilderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './page.css',
  template: `
    <h1>Formulaires — nouveaux types de champ</h1>
    <p class="lead">Champs <code>color</code> avancé, <code>secret</code>, <code>file</code> (mono/multi, glisser-déposer, progression, validation) et un type personnalisé <code>rating</code>. Chaque libellé porte une explication contextuelle (icône ⓘ).</p>
    <art-form-builder [config]="config" (formAction)="onAction($event)" />
    @if (result()) { <pre>{{ result() }}</pre> }
  `,
})
export class FormsPage {
  protected readonly result = signal('');

  protected readonly config: FormConfig = {
    sections: [
      {
        title: 'Identité', subtitle: 'Informations générales', icon: 'badge',
        explanation: 'Ces informations apparaissent sur **toutes** les factures. [En savoir plus](https://angular.dev)',
        fields: [
          { name: 'name', label: 'Raison sociale', type: 'text', colSpan: 6, required: true, explanation: 'Nom légal exact, tel qu’enregistré au registre du commerce.', validation: { validators: [{ type: 'required' }, { type: 'minLength', length: 3 }] } },
          { name: 'brand', label: 'Couleur de marque', type: 'color', colSpan: 6, defaultValue: '#EA580C', colorPalette: ['#EA580C', '#0E7490', '#15803D', '#7C3AED', '#DC2626', '#1C1917'], explanation: 'Utilisée pour les documents et e-mails. Saisissez un **hexadécimal** ou ouvrez le sélecteur.' },
          { name: 'rating', label: 'Satisfaction', type: 'rating', colSpan: 6, explanation: 'Type **personnalisé** enregistré avec `provideArtFieldType`.' },
        ],
      },
      {
        title: 'Sécurité', icon: 'lock', explanation: 'Les valeurs secrètes ne sont **jamais** journalisées.',
        fields: [
          { name: 'apiKey', label: 'Clé d’API', type: 'secret', colSpan: 6, defaultValue: 'sk_live_51Hx9f3KpQz', isReadOnly: true, secretRevealable: true, secretCopyFeedback: 'both', explanation: 'Clé **lecture seule** : copiez-la ou révélez-la 10 s.' },
          { name: 'password', label: 'Mot de passe', type: 'secret', colSpan: 6, secretMaskMode: 'length', secretRevealable: true, required: true, validation: { validators: [{ type: 'required' }, { type: 'minLength', length: 8, message: '8 caractères minimum' }] } },
        ],
      },
      {
        title: 'Documents', icon: 'folder',
        fields: [
          { name: 'logo', label: 'Logo (image, 2 Mo max)', type: 'file', colSpan: 6, fileAccept: ['image/*'], fileMaxSize: 2 * 1024 * 1024, fileUploadUrl: '/upload', explanation: 'Formats image uniquement. Un fichier dont le nom contient « fail » simule une erreur serveur.' },
          { name: 'docs', label: 'Justificatifs (3 max)', type: 'file', colSpan: 6, fileMultiple: true, fileMaxFiles: 3, fileAccept: ['.pdf', 'image/png'], fileMaxSize: 5 * 1024 * 1024, fileUploadUrl: '/upload' },
        ],
      },
    ],
  };

  protected onAction(e: FormActionEvent): void {
    if (e.buttonId === 'save') this.result.set(JSON.stringify({ ...e.parentValues, password: e.parentValues['password'] ? '••••••••' : undefined }, null, 2));
  }
}
