import { DOCUMENT } from '@angular/common';
import { ApplicationRef, ComponentRef, EnvironmentInjector, Injectable, createComponent, inject, signal } from '@angular/core';
import { ArtModalHostComponent } from './modal-host.component';
import { ModalRef } from './modal-ref';
import { ModalConfig } from './modal.models';

/**
 * Ouvre n'importe quel composant Angular dans une modale et retourne son résultat.
 *
 * ```ts
 * const client = await this.modal.open<CreateClientComponent, Client>({
 *   component: CreateClientComponent, title: 'Nouveau client', size: 'lg', inputs: { defaultName: 'Acme' },
 * });
 * if (client) this.form.patch({ clientId: client.id });
 * ```
 * Le composant enfant renvoie son résultat par `@Output() closed` ou en injectant `ModalRef` (`ref.close(data)`).
 * Fermée sans résultat (Échap, fond, ✕, `dismiss()`), la promesse résout `undefined` (ou rejette si `rejectOnDismiss`).
 * Les modales s'empilent (le niveau supérieur seul est actif : focus, Échap, lecteurs d'écran).
 */
@Injectable({ providedIn: 'root' })
export class ModalService {
  private readonly appRef = inject(ApplicationRef);
  private readonly envInjector = inject(EnvironmentInjector);
  private readonly doc = inject(DOCUMENT);

  private seq = 0;
  private readonly stack: { ref: ModalRef; host: ComponentRef<ArtModalHostComponent>; config: ModalConfig }[] = [];
  private readonly _depth = signal(0);
  private keyListener: ((e: KeyboardEvent) => void) | null = null;
  private previousOverflow = '';

  /** Nombre de modales ouvertes. */
  readonly depth = this._depth.asReadonly();

  /** Ouvre la modale et attend son résultat. */
  open<C = unknown, R = unknown>(config: ModalConfig<C>): Promise<R | undefined> {
    return this.openRef<C, R>(config).result;
  }

  /** Ouvre la modale et retourne la référence (pour la fermer de l'extérieur). */
  openRef<C = unknown, R = unknown>(config: ModalConfig<C>): ModalRef<R> {
    const ref = new ModalRef<R>(++this.seq, config.rejectOnDismiss ?? false);
    const host = createComponent(ArtModalHostComponent, { environmentInjector: this.envInjector });
    host.instance.config = config as ModalConfig;
    host.instance.ref = ref as ModalRef;

    // La modale précédente devient inerte tant que celle-ci est ouverte.
    this.stack.at(-1)?.host.instance.inactive.set(true);
    host.instance.level.set(this.stack.length);

    this.appRef.attachView(host.hostView);
    this.doc.body.appendChild(host.location.nativeElement as HTMLElement);
    this.stack.push({ ref: ref as ModalRef, host, config: config as ModalConfig });
    this._depth.set(this.stack.length);
    this.lockScroll();
    this.listenKeys();
    host.changeDetectorRef.detectChanges();
    host.instance.init();

    ref.onClosed = () => void this.teardown(ref as ModalRef);
    return ref;
  }

  /** Ferme toutes les modales sans résultat. */
  dismissAll(): void {
    [...this.stack].reverse().forEach((m) => m.ref.dismiss());
  }

  private async teardown(ref: ModalRef): Promise<void> {
    const idx = this.stack.findIndex((m) => m.ref === ref);
    if (idx < 0) return;
    const [entry] = this.stack.splice(idx, 1);
    this._depth.set(this.stack.length);

    // Réactive la modale du dessous AVANT de rendre le focus.
    const top = this.stack.at(-1);
    top?.host.instance.inactive.set(false);
    top?.host.changeDetectorRef.detectChanges();

    await entry.host.instance.leave();
    this.appRef.detachView(entry.host.hostView);
    entry.host.destroy();
    if (!this.stack.length) { this.unlockScroll(); this.unlistenKeys(); }
  }

  private listenKeys(): void {
    if (this.keyListener) return;
    this.keyListener = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.defaultPrevented) return;
      const top = this.stack.at(-1);
      if (top && top.config.closeOnEscape !== false) { e.stopPropagation(); top.ref.dismiss(); }
    };
    this.doc.addEventListener('keydown', this.keyListener);
  }

  private unlistenKeys(): void {
    if (this.keyListener) this.doc.removeEventListener('keydown', this.keyListener);
    this.keyListener = null;
  }

  private lockScroll(): void {
    if (this.stack.length === 1) {
      this.previousOverflow = this.doc.body.style.overflow;
      this.doc.body.style.overflow = 'hidden';
    }
  }

  private unlockScroll(): void {
    this.doc.body.style.overflow = this.previousOverflow;
  }
}
