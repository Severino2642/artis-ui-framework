import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { LoaderService } from '@artis/api';

/** Voile de chargement global piloté par `LoaderService` (alimenté par le loaderInterceptor de @artis/api). */
@Component({
  selector: 'art-loader',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (loader.loading()) {
      <div class="art-loader" role="status" aria-live="polite">
        <div class="art-loader__spinner" aria-hidden="true"></div>
        <p class="art-loader__text">{{ text() }}</p>
      </div>
    }
  `,
  styleUrl: './loader.component.css',
})
export class ArtLoaderComponent {
  protected readonly loader = inject(LoaderService);
  /** Texte affiché (et annoncé aux lecteurs d'écran). */
  readonly text = input('Chargement en cours…');
}
