import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { expectNoA11yViolations, flush } from '../../testing';
import { provideArtUiTexts } from '../i18n/ui-texts';
import { ArtInfoTipComponent } from './info-tip.component';
import { ArtLabelComponent } from './label.component';

describe('ArtInfoTipComponent', () => {
  let f: ComponentFixture<ArtInfoTipComponent>;
  const el = () => f.nativeElement as HTMLElement;
  const btn = () => el().querySelector<HTMLButtonElement>('button')!;
  const panel = () => el().querySelector<HTMLElement>('[role=tooltip]')!;

  beforeEach(() => {
    f = TestBed.createComponent(ArtInfoTipComponent);
    f.componentRef.setInput('text', 'Aide **importante**');
    f.componentRef.setInput('label', 'Nom');
    f.detectChanges();
  });

  it('bouton accessible : nom, aria-expanded, aria-describedby → bulle présente dans le DOM', () => {
    expect(btn().getAttribute('aria-label')).toContain('Nom');
    expect(btn().getAttribute('aria-expanded')).toBe('false');
    expect(btn().getAttribute('aria-describedby')).toBe(panel().id);
    expect(panel().textContent).toContain('Aide importante');
    expect(panel().classList.contains('tip__panel--open')).toBe(false);
  });

  it('clic : ouvre puis ferme', () => {
    btn().click(); f.detectChanges();
    expect(btn().getAttribute('aria-expanded')).toBe('true');
    expect(panel().classList.contains('tip__panel--open')).toBe(true);
    btn().click(); f.detectChanges();
    expect(btn().getAttribute('aria-expanded')).toBe('false');
  });

  it('Échap ferme, rend le focus au bouton et n’atteint pas le parent (ex. modale)', () => {
    const parentKey = vi.fn();
    document.addEventListener('keydown', parentKey);
    btn().click(); f.detectChanges();
    const ev = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
    btn().dispatchEvent(ev); f.detectChanges();
    expect(btn().getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(btn());
    expect(parentKey).not.toHaveBeenCalled();
    document.removeEventListener('keydown', parentKey);
  });

  it('clic à l’extérieur ferme', () => {
    btn().click(); f.detectChanges();
    document.body.click(); f.detectChanges();
    expect(btn().getAttribute('aria-expanded')).toBe('false');
  });

  it('trigger="hover" : ouvre au survol et au focus clavier', () => {
    f.componentRef.setInput('trigger', 'hover'); f.detectChanges();
    el().querySelector('.tip')!.dispatchEvent(new MouseEvent('mouseenter')); f.detectChanges();
    expect(btn().getAttribute('aria-expanded')).toBe('true');
    el().querySelector('.tip')!.dispatchEvent(new MouseEvent('mouseleave')); f.detectChanges();
    expect(btn().getAttribute('aria-expanded')).toBe('false');
    btn().dispatchEvent(new FocusEvent('focus')); f.detectChanges();
    expect(btn().getAttribute('aria-expanded')).toBe('true');
  });

  it('texte du libellé accessible traduisible', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideArtUiTexts({ info: { show: 'Show help' } })] });
    const g = TestBed.createComponent(ArtInfoTipComponent);
    g.componentRef.setInput('text', 'x'); g.componentRef.setInput('label', 'Name'); g.detectChanges();
    expect(g.nativeElement.querySelector('button').getAttribute('aria-label')).toBe('Show help : Name');
  });

  it('a11y (axe) : fermé et ouvert', async () => {
    await expectNoA11yViolations(el());
    btn().click(); f.detectChanges(); await flush();
    await expectNoA11yViolations(el());
  });
});

@Component({ standalone: true, imports: [ArtLabelComponent], template: `<art-label text="Nom" explanation="Aide" [required]="true" for="champ" /><input id="champ" /><art-label text="Sans aide" />` })
class Host {}

describe('ArtLabelComponent', () => {
  it('avec `for` → <label for>, étoile aria-hidden, info-bulle seulement si explication', async () => {
    const f = TestBed.createComponent(Host); f.detectChanges();
    const el = f.nativeElement as HTMLElement;
    const labels = el.querySelectorAll('art-label');
    expect(labels[0].querySelector('label')?.getAttribute('for')).toBe('champ');
    expect(labels[0].querySelector('.art-label__req')?.getAttribute('aria-hidden')).toBe('true');
    expect(labels[0].querySelector('art-info-tip')).not.toBeNull();
    expect(labels[1].querySelector('art-info-tip')).toBeNull();
    expect(labels[1].querySelector('label')).toBeNull();
    await expectNoA11yViolations(el);
  });
});

describe('ArtInfoTipComponent — couche supérieure (Popover API)', () => {
  const proto = HTMLElement.prototype as unknown as Record<string, unknown>;
  afterEach(() => { delete proto['showPopover']; delete proto['hidePopover']; });

  it('à l’ouverture la bulle passe en couche supérieure (échappe aux ancêtres transformés / overflow), à la fermeture elle en sort', async () => {
    const show = vi.fn(); const hide = vi.fn();
    proto['showPopover'] = show; proto['hidePopover'] = hide;
    const f = TestBed.createComponent(ArtInfoTipComponent);
    f.componentRef.setInput('text', 'Aide'); f.detectChanges();
    const el = f.nativeElement as HTMLElement;
    expect(el.querySelector('[role=tooltip]')?.getAttribute('popover')).toBe('manual');
    el.querySelector('button')!.click(); f.detectChanges(); await flush(); f.detectChanges();
    expect(show).toHaveBeenCalledOnce();
    el.querySelector('button')!.click(); f.detectChanges(); await flush();
    expect(hide).toHaveBeenCalledOnce();
  });

  it('repositionnement au défilement d’un conteneur quelconque (capture), arrêté à la fermeture', async () => {
    const f = TestBed.createComponent(ArtInfoTipComponent);
    f.componentRef.setInput('text', 'Aide'); f.detectChanges();
    const el = f.nativeElement as HTMLElement;
    const add = vi.spyOn(document, 'addEventListener'); const remove = vi.spyOn(document, 'removeEventListener');
    el.querySelector('button')!.click(); f.detectChanges(); await flush(); f.detectChanges();
    expect(add.mock.calls.some(([t, , cap]) => t === 'scroll' && cap === true)).toBe(true);
    el.querySelector('button')!.click(); f.detectChanges(); await flush(); f.detectChanges();
    expect(remove.mock.calls.some(([t, , cap]) => t === 'scroll' && cap === true)).toBe(true);
    add.mockRestore(); remove.mockRestore();
  });
});
