import {
  ChangeDetectionStrategy, Component, ElementRef, Injector, OnDestroy, ViewContainerRef, afterNextRender, inject, signal, viewChild,
} from '@angular/core';
import { ART_UI_TEXTS } from '../core/i18n/ui-texts';
import { uniqueId } from '../core/util/unique-id';
import { ModalRef } from './modal-ref';
import { ART_MODAL_DATA, ModalConfig } from './modal.models';

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"]),[contenteditable="true"]';

/** @internal Hôte d'une modale : fond, boîte de dialogue, focus trap. Créé par `ModalService`. */
@Component({
  selector: 'art-modal-host',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[style.--art-modal-level]': 'level()',
    '[attr.inert]': 'inactive() ? "" : null',
  },
  template: `
    <div class="art-modal__backdrop" [class.art-modal__backdrop--leaving]="leaving()" (mousedown)="onBackdropDown($event)">
      <div
        #dialog
        class="art-modal__dialog art-modal__dialog--{{ config.size ?? 'md' }}"
        [class.art-modal__dialog--leaving]="leaving()"
        role="dialog"
        aria-modal="true"
        tabindex="-1"
        [attr.aria-labelledby]="config.title ? titleId : null"
        [attr.aria-label]="config.title ? null : (config.ariaLabel ?? null)"
        (keydown)="onKeydown($event)"
      >
        @if (config.title || showClose) {
          <header class="art-modal__header">
            @if (config.title) { <h2 class="art-modal__title" [id]="titleId">{{ config.title }}</h2> } @else { <span></span> }
            @if (showClose) {
              <button type="button" class="art-modal__close" [attr.aria-label]="texts.modal.close" (click)="ref.dismiss()">
                <span class="material-symbols-outlined" aria-hidden="true">close</span>
              </button>
            }
          </header>
        }
        <div class="art-modal__body"><ng-container #outlet /></div>
      </div>
    </div>
  `,
  styleUrl: './modal-host.component.css',
})
export class ArtModalHostComponent implements OnDestroy {
  protected readonly texts = inject(ART_UI_TEXTS);
  private readonly injector = inject(Injector);

  /** Renseignés par le service avant le premier rendu. */
  config!: ModalConfig;
  ref!: ModalRef;
  readonly level = signal(0);
  readonly inactive = signal(false);
  protected readonly leaving = signal(false);
  protected readonly titleId = uniqueId('art-modal-title');

  private readonly outlet = viewChild.required('outlet', { read: ViewContainerRef });
  private readonly dialog = viewChild.required<ElementRef<HTMLElement>>('dialog');
  private childComponent: { destroy(): void } | null = null;
  private previouslyFocused: HTMLElement | null = null;
  private mouseDownOnBackdrop = false;

  get showClose(): boolean { return this.config.showCloseButton !== false; }

  /** Instancie le composant enfant et lui passe `inputs`, `ModalRef` et `ART_MODAL_DATA`. */
  init(): void {
    this.previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const injector = Injector.create({
      parent: this.injector,
      providers: [
        { provide: ModalRef, useValue: this.ref },
        { provide: ART_MODAL_DATA, useValue: this.config.inputs ?? {} },
      ],
    });
    const cmp = this.outlet().createComponent(this.config.component, { injector });
    for (const [k, v] of Object.entries(this.config.inputs ?? {})) {
      try { cmp.setInput(k, v); } catch { /* entrée inexistante : ignorée (la valeur reste disponible via ART_MODAL_DATA) */ }
    }
    // Contrat de retour n°1 : `@Output() closed` (EventEmitter ou output()). `cancelled` = fermeture sans résultat.
    const inst = cmp.instance as Record<string, { subscribe?: (fn: (v: unknown) => void) => unknown } | undefined>;
    inst['closed']?.subscribe?.((v) => this.ref.close(v));
    inst['cancelled']?.subscribe?.(() => this.ref.dismiss());
    cmp.changeDetectorRef.detectChanges();
    this.childComponent = cmp;

    afterNextRender(() => this.focusInitial(), { injector: this.injector });
  }

  /** Joue l'animation de sortie puis détruit. Retourne une promesse résolue quand tout est nettoyé. */
  async leave(): Promise<void> {
    this.leaving.set(true);
    const ms = parseFloat(getComputedStyle(this.dialog().nativeElement).getPropertyValue('--art-duration-base')) || 0;
    if (ms > 0) await new Promise((r) => setTimeout(r, ms));
    this.restoreFocus();
  }

  focusTop(): void {
    this.dialog().nativeElement.focus({ preventScroll: true });
  }

  protected onBackdropDown(e: MouseEvent): void {
    // Ne ferme que si le clic COMMENCE et FINIT sur le fond (évite la fermeture après un glisser-sélection).
    this.mouseDownOnBackdrop = e.target === e.currentTarget;
    if (this.mouseDownOnBackdrop && this.config.closeOnBackdrop !== false) this.ref.dismiss();
  }

  protected onKeydown(e: KeyboardEvent): void {
    if (e.key !== 'Tab') return;
    const items = this.focusables();
    const dlg = this.dialog().nativeElement;
    if (!items.length) { e.preventDefault(); dlg.focus(); return; }
    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;
    if (e.shiftKey && (active === first || active === dlg)) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus(); }
  }

  private focusables(): HTMLElement[] {
    return Array.from(this.dialog().nativeElement.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => {
      if (el.closest('[hidden],[inert]')) return false;
      const s = getComputedStyle(el);
      return s.display !== 'none' && s.visibility !== 'hidden';
    });
  }

  private focusInitial(): void {
    const dlg = this.dialog().nativeElement;
    // Priorité : élément marqué `autofocus` / `data-art-autofocus`, sinon 1er champ de saisie du corps, sinon la boîte.
    const target =
      dlg.querySelector<HTMLElement>('[data-art-autofocus],[autofocus]') ??
      dlg.querySelector<HTMLElement>('.art-modal__body input:not([type=hidden]):not([disabled]),.art-modal__body select,.art-modal__body textarea') ??
      null;
    (target ?? dlg).focus({ preventScroll: true });
  }

  private restoreFocus(): void {
    const el = this.previouslyFocused;
    if (el && document.contains(el)) el.focus({ preventScroll: true });
  }

  ngOnDestroy(): void {
    this.childComponent?.destroy();
  }
}
