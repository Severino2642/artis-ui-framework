import { Injectable, computed, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';

/** Compteur de requêtes en cours ; alimente `<art-loader />`. */
@Injectable({ providedIn: 'root' })
export class LoaderService {
  private readonly count = signal(0);

  /** Vrai tant qu'au moins une requête est en cours. */
  readonly loading = computed(() => this.count() > 0);
  /** Compatibilité `art-ui-generative` : flux booléen. */
  readonly loading$ = toObservable(this.loading);

  show(): void { this.count.update((n) => n + 1); }
  hide(): void { this.count.update((n) => Math.max(0, n - 1)); }
  reset(): void { this.count.set(0); }
}
