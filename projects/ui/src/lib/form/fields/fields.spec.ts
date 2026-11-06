import { provideHttpClient } from '@angular/common/http';
import { HttpEventType } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ToastService } from '@artis/toaster';
import { expectNoA11yViolations, flush } from '../../testing';
import { FormFieldConfig } from '../models/form-builder.model';
import { ArtColorFieldComponent } from './color-field.component';
import { ArtFileFieldComponent, formatBytes, matchesAccept } from './file-field.component';
import { ArtSecretFieldComponent } from './secret-field.component';
import { ART_COLOR_PALETTE } from './field-renderer';

function mount<T extends object>(cmp: new () => T, config: FormFieldConfig, value?: unknown, extra: Record<string, unknown> = {}) {
  const f = TestBed.createComponent(cmp);
  f.componentRef.setInput('config', config);
  f.componentRef.setInput('value', value);
  f.componentRef.setInput('inputId', 'fld');
  for (const [k, v] of Object.entries(extra)) f.componentRef.setInput(k, v);
  f.detectChanges();
  return f as ComponentFixture<T> & { componentInstance: T & { valueChange: { subscribe(fn: (v: unknown) => void): unknown } } };
}
const q = <E extends HTMLElement>(f: ComponentFixture<unknown>, s: string) => (f.nativeElement as HTMLElement).querySelector<E>(s)!;

describe('ArtColorFieldComponent', () => {
  const cfg: FormFieldConfig = { name: 'brand', label: 'Marque', type: 'color', colorPalette: ['#EA580C', '#0E7490'] };

  it('affiche l’aperçu (pastille) et le code hexadécimal à côté', () => {
    const f = mount(ArtColorFieldComponent, cfg, '#ea580c');
    expect(q<HTMLInputElement>(f, '.cf__text').value).toBe('#EA580C');
    expect(q(f, '.cf__swatch').style.background).toContain('rgb(234, 88, 12)');
  });

  it('saisie manuelle valide → émet l’hex normalisé ; invalide → message sans émission', () => {
    const f = mount(ArtColorFieldComponent, cfg, '');
    const emitted: unknown[] = []; f.componentInstance.valueChange.subscribe((v) => emitted.push(v));
    const input = q<HTMLInputElement>(f, '.cf__text');
    input.value = '#0e7490'; input.dispatchEvent(new Event('input')); f.detectChanges();
    expect(emitted).toEqual(['#0E7490']);
    input.value = 'zzz'; input.dispatchEvent(new Event('input')); f.detectChanges();
    expect(emitted.length).toBe(1);
    expect(q(f, '.cf__err').getAttribute('role')).toBe('alert');
    expect(input.getAttribute('aria-invalid')).toBe('true');
  });

  it('ouvre le sélecteur (dialog) : palette, hex, RVB, TSL ; palette cliquable → émet en temps réel', async () => {
    const f = mount(ArtColorFieldComponent, cfg, '#EA580C');
    const emitted: unknown[] = []; f.componentInstance.valueChange.subscribe((v) => emitted.push(v));
    const trigger = q<HTMLButtonElement>(f, '.cf__swatch');
    expect(trigger.getAttribute('aria-haspopup')).toBe('dialog');
    trigger.click(); f.detectChanges(); await flush();
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(q(f, '.cf__panel').getAttribute('role')).toBe('dialog');
    expect((f.nativeElement as HTMLElement).querySelectorAll('.cf__field input').length).toBe(7); // hex + 3 RVB + 3 TSL
    (f.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('.cf__chip')[1].click();
    expect(emitted.at(-1)).toBe('#0E7490');
    // champ RVB
    const r = (f.nativeElement as HTMLElement).querySelectorAll<HTMLInputElement>('.cf__field input')[1];
    r.value = '10'; r.dispatchEvent(new Event('input'));
    expect(emitted.at(-1)).toMatch(/^#0A/);
  });

  it('zone S/V et curseur de teinte émettent pendant la sélection', async () => {
    const f = mount(ArtColorFieldComponent, cfg, '#FF0000');
    const emitted: string[] = []; f.componentInstance.valueChange.subscribe((v) => emitted.push(v as string));
    q<HTMLButtonElement>(f, '.cf__swatch').click(); f.detectChanges(); await flush();
    const sv = q(f, '.cf__sv');
    sv.getBoundingClientRect = () => ({ left: 0, top: 0, width: 100, height: 100, right: 100, bottom: 100, x: 0, y: 0, toJSON: () => ({}) });
    sv.dispatchEvent(Object.assign(new MouseEvent('pointerdown', { clientX: 50, clientY: 50, bubbles: true }), { pointerId: 1 }));
    expect(emitted.at(-1)).toBe('#804040');
    const hue = q<HTMLInputElement>(f, '.cf__hue'); hue.value = '120'; hue.dispatchEvent(new Event('input'));
    expect(emitted.at(-1)).toBe('#408040');
  });

  it('Échap ferme le panneau et rend le focus au bouton ; clic extérieur ferme', async () => {
    const f = mount(ArtColorFieldComponent, cfg, '#EA580C');
    const trigger = q<HTMLButtonElement>(f, '.cf__swatch');
    trigger.click(); f.detectChanges(); await flush();
    q(f, '.cf__panel').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); f.detectChanges();
    expect(q(f, '.cf__panel')).toBeNull();
    expect(document.activeElement).toBe(trigger);
    trigger.click(); f.detectChanges();
    document.body.click(); f.detectChanges();
    expect(q(f, '.cf__panel')).toBeNull();
  });

  it('palette par défaut du projet (ART_COLOR_PALETTE) utilisée si le champ n’en définit pas', async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [{ provide: ART_COLOR_PALETTE, useValue: ['#111111'] }] });
    const f = mount(ArtColorFieldComponent, { name: 'c' }, '');
    q<HTMLButtonElement>(f, '.cf__swatch').click(); f.detectChanges(); await flush();
    expect((f.nativeElement as HTMLElement).querySelectorAll('.cf__chip').length).toBe(1);
  });

  it('lecture seule : bouton désactivé, champ non éditable', () => {
    const f = mount(ArtColorFieldComponent, cfg, '#EA580C', { readonly: true });
    expect(q<HTMLButtonElement>(f, '.cf__swatch').disabled).toBe(true);
    expect(q<HTMLInputElement>(f, '.cf__text').readOnly).toBe(true);
  });

  it('a11y (axe)', async () => {
    const f = mount(ArtColorFieldComponent, cfg, '#EA580C');
    const wrapper = document.createElement('div');
    wrapper.innerHTML = '<label for="fld">Marque</label>';
    wrapper.appendChild(f.nativeElement);
    document.body.appendChild(wrapper);
    q<HTMLButtonElement>(f, '.cf__swatch').click(); f.detectChanges(); await flush();
    await expectNoA11yViolations(wrapper);
    wrapper.remove();
  });
});

describe('ArtSecretFieldComponent', () => {
  const write = vi.fn().mockResolvedValue(undefined);
  beforeEach(() => { write.mockClear(); Object.defineProperty(navigator, 'clipboard', { value: { writeText: write }, configurable: true }); });
  const ro: FormFieldConfig = { name: 'k', label: 'Clé', type: 'secret', isReadOnly: true };

  it('lecture seule : masque à 10 points par défaut ; la valeur n’est PAS dans le DOM', () => {
    const f = mount(ArtSecretFieldComponent, ro, 'sk_live_SECRET', { readonly: true });
    expect(q(f, '.sf__display').textContent?.trim()).toBe('••••••••••');
    expect((f.nativeElement as HTMLElement).innerHTML).not.toContain('sk_live_SECRET');
  });

  it('masque fixe configurable ou proportionnel à la longueur', () => {
    expect(q(mount(ArtSecretFieldComponent, { ...ro, secretMaskLength: 6 }, 'abc', { readonly: true }), '.sf__display').textContent?.trim()).toBe('••••••');
    expect(q(mount(ArtSecretFieldComponent, { ...ro, secretMaskMode: 'length' }, 'abcd', { readonly: true }), '.sf__display').textContent?.trim()).toBe('••••');
  });

  it('valeur vide → texte « Aucune valeur » et copie désactivée', () => {
    const f = mount(ArtSecretFieldComponent, ro, '', { readonly: true });
    expect(q(f, '.sf__display').textContent).toContain('Aucune valeur');
    expect(q<HTMLButtonElement>(f, '.sf__btn').disabled).toBe(true);
  });

  it('copie : écrit dans le presse-papiers, bascule l’icône ✓ puis revient, annonce vocale', async () => {
    vi.useFakeTimers();
    const f = mount(ArtSecretFieldComponent, ro, 'sk_live_SECRET', { readonly: true });
    q<HTMLButtonElement>(f, '.sf__btn').click();
    await vi.advanceTimersByTimeAsync(0); f.detectChanges();
    expect(write).toHaveBeenCalledWith('sk_live_SECRET');
    expect(q(f, '.sf__btn .material-symbols-outlined').textContent).toBe('check');
    expect(q(f, '[role=status]').textContent).toContain('Valeur copiée');
    await vi.advanceTimersByTimeAsync(2100); f.detectChanges();
    expect(q(f, '.sf__btn .material-symbols-outlined').textContent).toBe('content_copy');
    vi.useRealTimers();
  });

  it('feedback toast (ou les deux) et échec de copie → toast d’erreur', async () => {
    const toast = TestBed.inject(ToastService);
    const f = mount(ArtSecretFieldComponent, { ...ro, secretCopyFeedback: 'toast' }, 'v', { readonly: true });
    q<HTMLButtonElement>(f, '.sf__btn').click(); await flush(); f.detectChanges();
    expect(toast.all().some((t) => t.type === 'success')).toBe(true);
    expect(q(f, '.sf__btn .material-symbols-outlined').textContent).toBe('content_copy'); // pas d'icône ✓ en mode toast
    toast.clear();
    write.mockRejectedValueOnce(new Error('denied'));
    const original = (document as unknown as Record<string, unknown>)['execCommand'];
    (document as unknown as Record<string, unknown>)['execCommand'] = vi.fn(() => false);
    q<HTMLButtonElement>(f, '.sf__btn').click(); await flush();
    expect(toast.all().some((t) => t.type === 'error')).toBe(true);
    (document as unknown as Record<string, unknown>)['execCommand'] = original;
  });

  it('bouton œil : révèle puis masque ; re-masquage automatique après le délai', async () => {
    vi.useFakeTimers();
    const f = mount(ArtSecretFieldComponent, { ...ro, secretRevealable: true, secretRevealTimeout: 3000 }, 'sk_live_SECRET', { readonly: true });
    const eye = q<HTMLButtonElement>(f, '.sf__btn');
    expect(eye.getAttribute('aria-pressed')).toBe('false');
    eye.click(); f.detectChanges();
    expect(q(f, '.sf__display').textContent).toContain('sk_live_SECRET');
    expect(eye.getAttribute('aria-pressed')).toBe('true');
    await vi.advanceTimersByTimeAsync(3100); f.detectChanges();
    expect(q(f, '.sf__display').textContent).not.toContain('sk_live_SECRET');
    vi.useRealTimers();
  });

  it('copie / révélation désactivables', () => {
    const f = mount(ArtSecretFieldComponent, { ...ro, secretCopyable: false }, 'v', { readonly: true });
    expect((f.nativeElement as HTMLElement).querySelectorAll('.sf__btn').length).toBe(0);
  });

  it('éditable : input type=password, émet la saisie, œil bascule en type=text', () => {
    const f = mount(ArtSecretFieldComponent, { name: 'p', secretRevealable: true }, 'abc');
    const emitted: unknown[] = []; f.componentInstance.valueChange.subscribe((v) => emitted.push(v));
    const input = q<HTMLInputElement>(f, '.sf__input');
    expect(input.type).toBe('password');
    expect(input.autocomplete).toBe('new-password');
    input.value = 'abcd'; input.dispatchEvent(new Event('input'));
    expect(emitted).toEqual(['abcd']);
    q<HTMLButtonElement>(f, '.sf__btn').click(); f.detectChanges();
    expect(input.type).toBe('text');
  });

  it('ne journalise jamais la valeur', async () => {
    const spies = (['log', 'info', 'warn', 'error', 'debug'] as const).map((m) => vi.spyOn(console, m).mockImplementation(() => undefined));
    const f = mount(ArtSecretFieldComponent, { ...ro, secretRevealable: true }, 'TOP-SECRET', { readonly: true });
    q<HTMLButtonElement>(f, '.sf__btn').click(); await flush();
    expect(spies.some((s) => JSON.stringify(s.mock.calls).includes('TOP-SECRET'))).toBe(false);
    spies.forEach((s) => s.mockRestore());
  });

  it('a11y (axe) en lecture seule et éditable', async () => {
    for (const [config, ro_] of [[ro, true], [{ name: 'p', label: 'Mot de passe', secretRevealable: true }, false]] as const) {
      const f = mount(ArtSecretFieldComponent, config, 'abc', { readonly: ro_ });
      const wrap = document.createElement('div'); wrap.innerHTML = '<label for="fld">Champ</label>'; wrap.appendChild(f.nativeElement); document.body.appendChild(wrap);
      await expectNoA11yViolations(wrap);
      wrap.remove();
    }
  });
});

describe('ArtFileFieldComponent', () => {
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
    vi.stubGlobal('URL', Object.assign(URL, { createObjectURL: vi.fn(() => 'blob:preview'), revokeObjectURL: vi.fn() }));
  });
  afterEach(() => vi.unstubAllGlobals());

  const png = (name = 'a.png', size = 10) => { const f = new File([new Uint8Array(size)], name, { type: 'image/png' }); return f; };
  const pdf = (name = 'a.pdf') => new File(['%PDF'], name, { type: 'application/pdf' });

  describe('utilitaires', () => {
    it('formatBytes', () => { expect(formatBytes(0)).toBe('0 o'); expect(formatBytes(1536)).toBe('1.5 Ko'); expect(formatBytes(5 * 1024 * 1024)).toBe('5.0 Mo'); });
    it('matchesAccept : MIME, joker, extension, vide', () => {
      expect(matchesAccept({ name: 'a.PDF', type: '' }, ['.pdf'])).toBe(true);
      expect(matchesAccept({ name: 'a.png', type: 'image/png' }, ['image/*'])).toBe(true);
      expect(matchesAccept({ name: 'a.png', type: 'image/png' }, ['application/pdf'])).toBe(false);
      expect(matchesAccept({ name: 'a', type: 'x/y' }, [])).toBe(true);
    });
  });

  it('mono sans endpoint : valeur = { name, size, type, file } ; un 2ᵉ fichier remplace le 1er', () => {
    const f = mount(ArtFileFieldComponent, { name: 'doc', type: 'file' }, null);
    const out: unknown[] = []; f.componentInstance.valueChange.subscribe((v) => out.push(v));
    const c = f.componentInstance as unknown as { addFiles(files: File[]): void };
    c.addFiles([png('a.png')]); f.detectChanges();
    expect(out.at(-1)).toMatchObject({ name: 'a.png', size: 10, type: 'image/png' });
    expect((out.at(-1) as { file: File }).file).toBeInstanceOf(File);
    c.addFiles([png('b.png')]); f.detectChanges();
    expect((f.nativeElement as HTMLElement).querySelectorAll('.fl__item').length).toBe(1);
    expect(out.at(-1)).toMatchObject({ name: 'b.png' });
    expect(q(f, '.fl__drop')).toBeNull(); // mono : zone masquée tant qu'un fichier est présent
  });

  it('validation : type, taille, nombre max — erreurs lisibles dans une zone role=alert', () => {
    const f = mount(ArtFileFieldComponent, { name: 'd', fileMultiple: true, fileMaxFiles: 2, fileAccept: ['image/*'], fileMaxSize: 100 }, []);
    const c = f.componentInstance as unknown as { addFiles(files: File[]): void };
    c.addFiles([pdf('x.pdf'), png('big.png', 500)]); f.detectChanges();
    const errs = Array.from((f.nativeElement as HTMLElement).querySelectorAll('.fl__errors li')).map((l) => l.textContent);
    expect(errs[0]).toContain('x.pdf'); expect(errs[0]).toContain('image/*');
    expect(errs[1]).toContain('big.png'); expect(errs[1]).toContain('100 o');
    expect(q(f, '.fl__errors').getAttribute('role')).toBe('alert');

    c.addFiles([png('1.png'), png('2.png'), png('3.png')]); f.detectChanges();
    expect((f.nativeElement as HTMLElement).querySelectorAll('.fl__item').length).toBe(2);
    expect(q(f, '.fl__errors').textContent).toContain('(2)');
  });

  it('glisser-déposer : état survol puis ajout', () => {
    const f = mount(ArtFileFieldComponent, { name: 'd', fileMultiple: true }, []);
    const drop = q(f, '.fl__drop');
    const over = new Event('dragover', { cancelable: true }); drop.dispatchEvent(over); f.detectChanges();
    expect(over.defaultPrevented).toBe(true);
    expect(q(f, '.fl--drag')).not.toBeNull();
    drop.dispatchEvent(Object.assign(new Event('drop', { cancelable: true }), { dataTransfer: { files: [png('d.png')] } })); f.detectChanges();
    expect(q(f, '.fl--drag')).toBeNull();
    expect((f.nativeElement as HTMLElement).querySelectorAll('.fl__item').length).toBe(1);
  });

  it('zone de dépôt utilisable au clavier (Entrée/Espace) et nommée', () => {
    const f = mount(ArtFileFieldComponent, { name: 'd' }, null);
    const drop = q(f, '.fl__drop');
    expect(drop.getAttribute('role')).toBe('button');
    expect(drop.tabIndex).toBe(0);
    expect(drop.getAttribute('aria-label')).toContain('Glissez-déposez');
    const click = vi.spyOn(q<HTMLInputElement>(f, 'input[type=file]'), 'click');
    drop.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(click).toHaveBeenCalled();
  });

  it('envoi : progression → valeur émise uniquement après succès, avec id/url du serveur', () => {
    const f = mount(ArtFileFieldComponent, { name: 'logo', fileUploadUrl: '/up', fileFieldName: 'document', fileUploadFields: { folder: 'logos' } }, null);
    const out: unknown[] = []; f.componentInstance.valueChange.subscribe((v) => out.push(v));
    (f.componentInstance as unknown as { addFiles(files: File[]): void }).addFiles([png('logo.png', 20)]); f.detectChanges();
    expect(out).toEqual([null]); // rien d'exploitable avant la fin de l'envoi
    const req = http.expectOne('/up');
    expect((req.request.body as FormData).get('document')).toBeInstanceOf(File);
    expect((req.request.body as FormData).get('folder')).toBe('logos');
    req.event({ type: HttpEventType.UploadProgress, loaded: 40, total: 100 }); f.detectChanges();
    const bar = q(f, '[role=progressbar]');
    expect(bar.getAttribute('aria-valuenow')).toBe('40');
    expect(bar.getAttribute('aria-label')).toContain('40');
    req.flush({ data: { id: 9, url: 'https://cdn.test/logo.png' } }); f.detectChanges();
    expect(out.at(-1)).toEqual({ name: 'logo.png', size: 20, type: 'image/png', id: 9, url: 'https://cdn.test/logo.png' });
    expect(q(f, '[role=progressbar]')).toBeNull();
  });

  it('échec d’envoi : message d’erreur par fichier, réessai possible, rien d’émis', () => {
    const f = mount(ArtFileFieldComponent, { name: 'd', fileUploadUrl: '/up' }, null);
    const out: unknown[] = []; f.componentInstance.valueChange.subscribe((v) => out.push(v));
    (f.componentInstance as unknown as { addFiles(files: File[]): void }).addFiles([pdf('c.pdf')]); f.detectChanges();
    http.expectOne('/up').flush({}, { status: 500, statusText: 'x' }); f.detectChanges();
    expect(q(f, '.fl__err').textContent).toContain('c.pdf');
    expect(out.at(-1)).toBeNull();
    const retry = q<HTMLButtonElement>(f, '.fl__btn');
    expect(retry.getAttribute('aria-label')).toContain('Réessayer');
    retry.click(); f.detectChanges();
    http.expectOne('/up').flush({ id: 1 });
    expect(out.at(-1)).toMatchObject({ name: 'c.pdf', id: 1 });
  });

  it('suppression : annule l’envoi en cours, retire l’élément, révoque l’aperçu', () => {
    const f = mount(ArtFileFieldComponent, { name: 'd', fileUploadUrl: '/up', fileMultiple: true }, []);
    const out: unknown[] = []; f.componentInstance.valueChange.subscribe((v) => out.push(v));
    (f.componentInstance as unknown as { addFiles(files: File[]): void }).addFiles([png('p.png')]); f.detectChanges();
    const req = http.expectOne('/up');
    expect(q(f, '.fl__thumb img').getAttribute('src')).toBe('blob:preview');
    q<HTMLButtonElement>(f, '.fl__btn').click(); f.detectChanges();
    expect(req.cancelled).toBe(true);
    expect((f.nativeElement as HTMLElement).querySelectorAll('.fl__item').length).toBe(0);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:preview');
    expect(out.at(-1)).toEqual([]);
  });

  it('valeur initiale (fichiers déjà envoyés) affichée ; lecture seule sans zone ni suppression', () => {
    const f = mount(ArtFileFieldComponent, { name: 'd', fileMultiple: true }, [{ name: 'x.pdf', size: 2048, type: 'application/pdf', url: 'https://c.test/x.pdf', id: 1 }], { readonly: true });
    expect(q(f, '.fl__name').textContent).toBe('x.pdf');
    expect(q(f, '.fl__drop')).toBeNull();
    expect(q(f, '.fl__btn')).toBeNull();
  });

  it('a11y (axe)', async () => {
    const f = mount(ArtFileFieldComponent, { name: 'd', fileMultiple: true, fileAccept: ['image/*'] }, [{ name: 'x.png', size: 2048, type: 'image/png' }]);
    (f.componentInstance as unknown as { addFiles(files: File[]): void }).addFiles([pdf('bad.pdf')]); f.detectChanges();
    const wrap = document.createElement('div'); wrap.innerHTML = '<span id="lbl">Fichiers</span>'; wrap.appendChild(f.nativeElement); document.body.appendChild(wrap);
    await expectNoA11yViolations(wrap);
    wrap.remove();
  });
});
