import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ArtLabelComponent } from '@artis/ui';
import { ThemeService } from '@artis/theme';
import { ToastService } from '@artis/toaster';

const GROUPS: { title: string; tokens: string[] }[] = [
  { title: 'Primaire', tokens: ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900'].map((n) => `--art-primary-${n}`) },
  { title: 'Neutres', tokens: ['50', '100', '150', '200', '300', '400', '500', '600', '700', '800', '900'].map((n) => `--art-neutral-${n}`) },
  { title: 'Sémantiques', tokens: ['--art-bg', '--art-surface', '--art-surface-subtle', '--art-border', '--art-text', '--art-text-muted', '--art-primary', '--art-success', '--art-danger', '--art-warning', '--art-info', '--art-accent'] },
];

@Component({
  selector: 'demo-design-page',
  standalone: true,
  imports: [ArtLabelComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './page.css',
  template: `
    <h1>Design system</h1>
    <p class="lead">Toute la Direction Artistique tient dans un fichier de tokens. Changez de thème ci-dessous : aucun composant n'est modifié.</p>

    <div class="card">
      <div class="row" role="group" aria-label="Thème">
        @for (t of theme.available; track t) {
          <button type="button" class="btn" [class.btn--active]="theme.theme() === t" [attr.aria-pressed]="theme.theme() === t" (click)="theme.set(t)">{{ t }}</button>
        }
        <button type="button" class="btn" [class.btn--active]="theme.theme() === 'auto'" [attr.aria-pressed]="theme.theme() === 'auto'" (click)="theme.set('auto')">auto (système)</button>
      </div>
      <div class="row" style="margin-top: var(--art-space-4)">
        <button type="button" class="btn btn--primary">Action principale</button>
        <button type="button" class="btn">Secondaire</button>
        <button type="button" class="btn btn--danger">Danger</button>
        <art-label text="Libellé avec explication" explanation="Ce **libellé** porte une explication en *Markdown restreint*. [Documentation](https://angular.dev)" />
        <button type="button" class="btn" (click)="toast.success('Enregistré avec succès')">Toast succès</button>
        <button type="button" class="btn" (click)="toast.error('Une erreur est survenue')">Toast erreur</button>
      </div>
    </div>

    @for (g of groups; track g.title) {
      <h2>{{ g.title }}</h2>
      <div class="grid">
        @for (t of g.tokens; track t) {
          <div class="sw"><i [style.background]="'var(' + t + ')'"></i>{{ t.replace('--art-', '') }}</div>
        }
      </div>
    }
  `,
})
export class DesignPage {
  protected readonly theme = inject(ThemeService);
  protected readonly toast = inject(ToastService);
  protected readonly groups = GROUPS;
}
