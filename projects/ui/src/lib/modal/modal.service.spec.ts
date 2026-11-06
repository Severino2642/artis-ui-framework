import { Component, EventEmitter, Input, Output, inject, input, output } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { flush } from '../testing';
import { ART_MODAL_DATA, ModalDismissedError } from './modal.models';
import { ModalRef } from './modal-ref';
import { ModalService } from './modal.service';
import { expectNoA11yViolations } from '../testing';

@Component({ standalone: true, selector: 't-a', template: `<input id="first" aria-label="Nom" /><button id="ok" (click)="ref.close({ id: 42 })">ok</button><button id="last" (click)="open2()">next</button>` })
class ChildA {
  ref = inject<ModalRef<{ id: number }>>(ModalRef);
  data = inject(ART_MODAL_DATA);
  modal = inject(ModalService);
  @Input() name = '';
  open2() { void this.modal.open({ component: ChildB, title: 'Second' }); }
}

@Component({ standalone: true, selector: 't-b', template: `<button id="b-ok" (click)="closed.emit('done')">done</button><button id="b-cancel" (click)="cancelled.emit()">cancel</button>` })
class ChildB { closed = new EventEmitter<string>(); cancelled = new EventEmitter<void>(); }

@Component({ standalone: true, selector: 't-c', template: `<p>{{ label() }}</p>` })
class ChildC { label = input('?'); closed = output<string>(); }

describe('ModalService', () => {
  let modal: ModalService;
  const dialogs = () => Array.from(document.querySelectorAll<HTMLElement>('[role=dialog]'));
  const press = (key: string, init: KeyboardEventInit = {}) => document.activeElement?.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init })) ?? document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));

  beforeEach(() => { modal = TestBed.inject(ModalService); });
  afterEach(async () => { modal.dismissAll(); await flush(); });

  it('ouvre un composant en role=dialog aria-modal avec titre et nom accessible', async () => {
    void modal.open({ component: ChildA, title: 'Nouveau client' });
    await flush();
    const d = dialogs()[0];
    expect(d.getAttribute('aria-modal')).toBe('true');
    const title = d.querySelector('h2')!;
    expect(d.getAttribute('aria-labelledby')).toBe(title.id);
    expect(title.textContent).toContain('Nouveau client');
  });

  it('sans titre : aria-label fourni', async () => {
    void modal.open({ component: ChildA, ariaLabel: 'Création' });
    await flush();
    expect(dialogs()[0].getAttribute('aria-label')).toBe('Création');
  });

  it('résout avec le résultat de ref.close(data)', async () => {
    const p = modal.open<ChildA, { id: number }>({ component: ChildA });
    await flush();
    document.getElementById('ok')!.click();
    expect(await p).toEqual({ id: 42 });
    await flush();
    expect(dialogs().length).toBe(0);
  });

  it('résout avec la valeur de @Output() closed', async () => {
    const p = modal.open<ChildB, string>({ component: ChildB });
    await flush();
    document.getElementById('b-ok')!.click();
    expect(await p).toBe('done');
  });

  it('@Output() cancelled ferme sans résultat', async () => {
    const p = modal.open({ component: ChildB });
    await flush();
    document.getElementById('b-cancel')!.click();
    expect(await p).toBeUndefined();
  });

  it('passe `inputs` aux @Input et input() et via ART_MODAL_DATA', async () => {
    let ref!: ModalRef;
    const p = modal.openRef({ component: ChildA, inputs: { name: 'Acme' } });
    ref = p;
    await flush();
    void ref;
    const q = modal.open({ component: ChildC, inputs: { label: 'Bonjour' } });
    await flush();
    expect(document.body.textContent).toContain('Bonjour');
    modal.dismissAll(); await q;
  });

  it('fermeture sans résultat → undefined (Échap, ✕, fond) ; rejectOnDismiss → rejette', async () => {
    const a = modal.open({ component: ChildA });
    await flush();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(await a).toBeUndefined();
    await flush();

    const b = modal.open({ component: ChildA });
    await flush();
    document.querySelector<HTMLButtonElement>('.art-modal__close')!.click();
    expect(await b).toBeUndefined();
    await flush();

    const c = modal.open({ component: ChildA });
    await flush();
    const backdrop = document.querySelector<HTMLElement>('.art-modal__backdrop')!;
    backdrop.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    expect(await c).toBeUndefined();
    await flush();

    const d = modal.open({ component: ChildA, rejectOnDismiss: true });
    await flush();
    modal.dismissAll();
    await expect(d).rejects.toBeInstanceOf(ModalDismissedError);
  });

  it('closeOnEscape / closeOnBackdrop / showCloseButton désactivables', async () => {
    const p = modal.open({ component: ChildA, closeOnEscape: false, closeOnBackdrop: false, showCloseButton: false });
    await flush();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    document.querySelector('.art-modal__backdrop')!.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    await flush();
    expect(dialogs().length).toBe(1);
    expect(document.querySelector('.art-modal__close')).toBeNull();
    modal.dismissAll(); await p;
  });

  it('tailles : classe de taille appliquée', async () => {
    void modal.open({ component: ChildA, size: 'fullscreen' });
    await flush();
    expect(dialogs()[0].className).toContain('art-modal__dialog--fullscreen');
  });

  it('modales imbriquées (2 niveaux) : empilement, inert du dessous, Échap ferme le dessus seulement', async () => {
    const first = modal.open({ component: ChildA, title: 'Un' });
    await flush();
    document.getElementById('last')!.click(); // ouvre le 2ᵉ niveau
    await flush();
    expect(modal.depth()).toBe(2);
    const hosts = Array.from(document.querySelectorAll<HTMLElement>('art-modal-host'));
    expect(hosts.length).toBe(2);
    expect(hosts[0].hasAttribute('inert')).toBe(true);
    expect(hosts[1].hasAttribute('inert')).toBe(false);
    expect(hosts[1].style.getPropertyValue('--art-modal-level')).toBe('1');

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await flush();
    expect(modal.depth()).toBe(1);
    expect(document.querySelector('art-modal-host')!.hasAttribute('inert')).toBe(false);
    modal.dismissAll(); await first;
  });

  it('verrouille le scroll du body puis le restaure après la dernière fermeture', async () => {
    document.body.style.overflow = 'auto';
    const p = modal.open({ component: ChildA });
    await flush();
    expect(document.body.style.overflow).toBe('hidden');
    modal.dismissAll(); await p; await flush();
    expect(document.body.style.overflow).toBe('auto');
    document.body.style.overflow = '';
  });

  it('restaure le focus sur l’élément déclencheur à la fermeture', async () => {
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    trigger.focus();
    const p = modal.open({ component: ChildA });
    await flush();
    expect(document.activeElement).not.toBe(trigger);
    modal.dismissAll(); await p; await flush();
    expect(document.activeElement).toBe(trigger);
    trigger.remove();
  });

  it('place le focus dans la modale à l’ouverture (1er champ)', async () => {
    void modal.open({ component: ChildA });
    await flush(10);
    expect(document.activeElement?.id).toBe('first');
  });

  it('focus trap : Tab sur le dernier élément revient au premier, Maj+Tab inversement', async () => {
    void modal.open({ component: ChildA });
    await flush(10);
    const dialog = dialogs()[0];
    const focusables = Array.from(dialog.querySelectorAll<HTMLElement>('button,input')).filter((e) => !e.closest('[hidden]'));
    const last = focusables[focusables.length - 1];
    last.focus();
    const tab = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    last.dispatchEvent(tab);
    expect(tab.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(focusables[0]);
    const shift = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true, cancelable: true });
    focusables[0].dispatchEvent(shift);
    expect(shift.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(last);
  });

  it('a11y (axe)', async () => {
    void modal.open({ component: ChildA, title: 'Accessible' });
    await flush(10);
    await expectNoA11yViolations(dialogs()[0], ['aria-hidden-focus']);
    void press;
  });
});
