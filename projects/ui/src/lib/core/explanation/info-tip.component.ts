import {
  ChangeDetectionStrategy, Component, ElementRef, HostListener, Injector, afterNextRender, computed, effect, inject, input, signal, viewChild,
} from '@angular/core';
import { ART_UI_TEXTS } from '../i18n/ui-texts';
import { ArtMarkdownLiteComponent } from '../markdown/markdown-lite.component';
import { closeTopLayer, openTopLayer, trackViewport } from '../util/top-layer';
import { uniqueId } from '../util/unique-id';

/**
 * Icône « i » + bulle d'explication, accessible.
 *
 * - `trigger="click"` (défaut) : clic/Entrée/Espace ouvre et ferme ; Échap ferme et rend le focus au bouton ;
 *   clic extérieur ferme. `trigger="hover"` : ouvre aussi au survol et au focus clavier.
 * - Le texte est décrit via `aria-describedby` (la bulle est toujours dans le DOM, masquée visuellement si fermée).
 * - Le texte accepte un Markdown restreint (gras, italique, liens).
 */
@Component({
  selector: 'art-info-tip',
  standalone: true,
  imports: [ArtMarkdownLiteComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="tip" (mouseenter)="hoverIn()" (mouseleave)="hoverOut()">
      <button
        #btn
        type="button"
        class="tip__btn"
        [attr.aria-label]="ariaLabel()"
        [attr.aria-expanded]="open()"
        [attr.aria-describedby]="panelId"
        (click)="toggle($event)"
        (focus)="focusIn()"
        (blur)="focusOut()"
      >
        <span class="material-symbols-outlined" aria-hidden="true">{{ icon() }}</span>
      </button>
      <span #panel [id]="panelId" role="tooltip" popover="manual" class="tip__panel" [class.tip__panel--open]="open()" [style.top.px]="pos().top" [style.left.px]="pos().left">
        <art-markdown-lite [source]="text()" />
      </span>
    </span>
  `,
  styleUrl: './info-tip.component.css',
})
export class ArtInfoTipComponent {
  private readonly texts = inject(ART_UI_TEXTS);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  /** Explication (Markdown restreint). */
  readonly text = input.required<string>();
  /** Libellé auquel l'explication se rapporte (pour l'accessibilité). */
  readonly label = input('');
  /** Comportement d'ouverture. */
  readonly trigger = input<'click' | 'hover'>('click');
  /** Nom d'icône Material Symbols. */
  readonly icon = input('info');

  protected readonly panelId = uniqueId('art-tip');
  protected readonly open = signal(false);
  protected readonly pos = signal({ top: 0, left: 0 });
  protected readonly ariaLabel = computed(() => `${this.texts.info.show}${this.label() ? ' : ' + this.label() : ''}`);

  private readonly btn = viewChild.required<ElementRef<HTMLButtonElement>>('btn');
  private readonly panel = viewChild.required<ElementRef<HTMLElement>>('panel');

  constructor() {
    // Ouverture : passe la bulle en couche supérieure PUIS la positionne ; fermeture : la retire.
    effect(() => {
      const panel = this.panel().nativeElement;
      // Après le rendu : la classe d'ouverture est appliquée, la bulle a donc une taille mesurable.
      if (this.open()) afterNextRender(() => { openTopLayer(panel); this.place(); }, { injector: this.injector });
      else closeTopLayer(panel);
    });
    // Repositionne au redimensionnement et au défilement de N'IMPORTE QUEL conteneur.
    effect((onCleanup) => {
      if (this.open()) onCleanup(trackViewport(() => this.place()));
    });
  }

  protected toggle(ev: Event): void {
    ev.stopPropagation();
    ev.preventDefault();
    this.open.update((v) => !v);
  }
  protected hoverIn(): void { if (this.trigger() === 'hover') this.open.set(true); }
  protected hoverOut(): void { if (this.trigger() === 'hover') this.open.set(false); }
  protected focusIn(): void { if (this.trigger() === 'hover') this.open.set(true); }
  protected focusOut(): void { if (this.trigger() === 'hover') this.open.set(false); }

  @HostListener('document:click', ['$event'])
  onDocClick(e: Event): void {
    if (this.open() && !this.host.nativeElement.contains(e.target as Node)) this.open.set(false);
  }

  @HostListener('keydown.escape', ['$event'])
  onEscape(e: Event): void {
    if (this.open()) {
      e.stopPropagation();
      this.open.set(false);
      this.btn().nativeElement.focus();
    }
  }

  /** Positionne la bulle en `fixed` sous l'icône (évite d'être rognée par un `overflow: hidden` parent). */
  private place(): void {
    const b = this.btn().nativeElement.getBoundingClientRect();
    const p = this.panel().nativeElement.getBoundingClientRect();
    const margin = 8;
    let left = b.left + b.width / 2 - p.width / 2;
    left = Math.max(margin, Math.min(left, window.innerWidth - p.width - margin));
    let top = b.bottom + 6;
    if (top + p.height > window.innerHeight - margin && b.top - p.height - 6 > margin) top = b.top - p.height - 6;
    this.pos.set({ top, left });
  }
}
