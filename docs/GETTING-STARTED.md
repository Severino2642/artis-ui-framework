# Démarrer un projet avec Artis UI (≈ 30 minutes)

## 1. Installer (≈ 5 min)

```bash
ng new mon-projet --style=css --routing        # Angular 21
npm i @artis/theme @artis/toaster @artis/api @artis/ui   # depuis votre registre npm privé
```

## 2. Charger le thème (≈ 2 min)

`angular.json` → `projects.mon-projet.architect.build.options.styles` :

```json
"styles": [
  "node_modules/@artis/theme/styles/index.css",
  "src/mon-theme.css",
  "src/styles.css"
]
```

`src/index.html` — polices (le framework n'en embarque pas) :

```html
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,0..200" rel="stylesheet">
```

## 3. Configurer l'application (≈ 10 min)

```ts
// app.config.ts
import { provideRouter } from '@angular/router';
import { provideArtTheme } from '@artis/theme';
import { provideToaster } from '@artis/toaster';
import { provideArtApi } from '@artis/api';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideArtTheme({ defaultTheme: 'light' }),
    provideToaster({ position: 'top-right', maxVisible: 4 }),
    provideArtApi({
      baseUrl: 'https://api.mon-projet.com',
      storage: 'memory',                       // 'sessionStorage' | 'localStorage' | 'memory'
      authEndpoints: { login: '/auth/login', refresh: '/auth/refresh', logout: '/auth/logout' },
      businessErrors: {                        // codes d'erreur MÉTIER → message + action
        QUOTA_EXCEEDED: { message: 'Quota atteint.', action: { label: 'Augmenter', route: '/plan' } },
      },
    }),
  ],
};
```

```ts
// app.ts — une seule fois
imports: [RouterOutlet, ToastContainerComponent, ArtLoaderComponent],
template: `<router-outlet /><art-toast-container /><art-loader />`
```

À partir d'ici : **toute erreur HTTP affiche son toast sans code dans vos composants**, les jetons sont joints/rafraîchis, `X-Request-Id` est ajouté.

## 4. Un premier formulaire (≈ 10 min)

```ts
import { ArtFormBuilderComponent, FormConfig } from '@artis/ui';

@Component({ standalone: true, imports: [ArtFormBuilderComponent],
  template: `<art-form-builder [config]="config" (formAction)="onAction($event)" />` })
export class ClientForm {
  config: FormConfig = { sections: [{
    title: 'Identité',
    explanation: 'Visible sur **toutes** les factures.',          // ⓘ sur le titre
    fields: [
      { name: 'name',  label: 'Raison sociale', type: 'text', required: true, colSpan: 6,
        explanation: 'Nom légal exact.',                            // ⓘ sur le libellé
        validation: { validators: [{ type: 'required' }] } },
      { name: 'brand', label: 'Couleur', type: 'color', colSpan: 6 },
      { name: 'logo',  label: 'Logo', type: 'file', fileAccept: ['image/*'], fileMaxSize: 2_000_000, fileUploadUrl: '/files' },
      { name: 'token', label: 'Jeton', type: 'secret', isReadOnly: true, secretRevealable: true },
    ],
  }] };
  onAction(e: FormActionEvent) { if (e.buttonId === 'save') this.api.post('/clients', e.parentValues).subscribe(); }
}
```

## 5. Ouvrir un composant en modale (≈ 3 min)

```ts
const client = await this.modal.open<CreateClientComponent, Client>({
  component: CreateClientComponent, title: 'Nouveau client', size: 'lg', inputs: { defaultName: 'Acme' },
});
if (client) { /* utiliser le client créé, sans quitter la page */ }
```

Dans `CreateClientComponent` : `private ref = inject(ModalRef<Client>); … this.ref.close(client);`
(ou `@Output() closed` / `output()`).

## Checklist « prêt à coder »

- [ ] Thème chargé, polices chargées
- [ ] `provideArtApi`, `provideToaster`, `provideArtTheme` dans `app.config.ts`
- [ ] `<art-toast-container />` et `<art-loader />` dans le composant racine
- [ ] `authGuard` sur les routes protégées (`canActivate: [authGuard]`)
- [ ] Fichier `mon-theme.css` pour la DA du projet (voir [DESIGN-SYSTEM](DESIGN-SYSTEM.md))
