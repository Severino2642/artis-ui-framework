import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { expectNoA11yViolations, flush } from '../../testing';
import { ArtFieldBase, provideArtFieldType } from '../fields/field-renderer';
import { FormFieldConfig } from '../models/form-builder.model';
import { ArtFormFieldComponent } from './form-field.component';

@Component({ standalone: true, selector: 't-rating', template: `<button id="star" type="button" (click)="valueChange.emit(5)">★ {{ value() }}</button><span id="cfg">{{ config().name }}|{{ inputId() }}|{{ readonly() }}</span>` })
class RatingStub extends ArtFieldBase {}

describe('ArtFormFieldComponent', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), provideArtFieldType('rating', RatingStub)] }));

  const mount = (config: FormFieldConfig, value?: unknown) => {
    const f = TestBed.createComponent(ArtFormFieldComponent);
    f.componentRef.setInput('config', config);
    if (value !== undefined) f.componentRef.setInput('value', value);
    f.detectChanges();
    return f;
  };
  const el = (f: ComponentFixture<unknown>) => f.nativeElement as HTMLElement;

  it('associe <label for> au contrôle (id unique) et marque les champs requis', () => {
    const f = mount({ name: 'nom', label: 'Nom', type: 'text', required: true });
    const label = el(f).querySelector('label')!;
    const input = el(f).querySelector('input')!;
    expect(label.getAttribute('for')).toBe(input.id);
    expect(input.id).toMatch(/^art-ff-\d+$/);
    expect(el(f).querySelector('.ff-required')?.getAttribute('aria-hidden')).toBe('true');
    const g = mount({ name: 'x', label: 'X', type: 'text' });
    expect(el(g).querySelector('input')!.id).not.toBe(input.id);
  });

  it('explication : icône ⓘ à côté du libellé (hors du <label>), absente sans explication', () => {
    const f = mount({ name: 'tva', label: 'TVA', type: 'text', explanation: 'Format **FR**' });
    const tip = el(f).querySelector('art-info-tip')!;
    expect(tip).not.toBeNull();
    expect(el(f).querySelector('label')!.contains(tip)).toBe(false);
    expect(tip.querySelector('[role=tooltip]')?.textContent).toContain('Format FR');
    expect(el(mount({ name: 'a', label: 'A', type: 'text' })).querySelector('art-info-tip')).toBeNull();
  });

  it('rend les nouveaux types : color, secret, file', () => {
    expect(el(mount({ name: 'c', type: 'color' }, '#EA580C')).querySelector('art-color-field')).not.toBeNull();
    expect(el(mount({ name: 's', type: 'secret' }, 'x')).querySelector('art-secret-field')).not.toBeNull();
    expect(el(mount({ name: 'f', type: 'file' })).querySelector('art-file-field')).not.toBeNull();
    expect(el(mount({ name: 'c', type: 'color' })).querySelector('input[type=color]')).toBeNull(); // l'ancien <input type=color> natif a disparu
  });

  it('type personnalisé enregistré : composant monté, entrées transmises, valueChange relayé', () => {
    const f = mount({ name: 'note', type: 'rating', label: 'Note' }, 3);
    const out: unknown[] = []; f.componentInstance.valueChange.subscribe((v) => out.push(v));
    expect(el(f).querySelector('#star')?.textContent).toContain('3');
    expect(el(f).querySelector('#cfg')?.textContent).toMatch(/^note\|art-ff-\d+\|false$/);
    el(f).querySelector<HTMLButtonElement>('#star')!.click();
    expect(out).toEqual([5]);
  });

  it('erreur de validation : role=alert relié par aria-describedby, aria-invalid sur le contrôle', async () => {
    const f = mount({ name: 'e', label: 'E-mail', type: 'text', validation: { validators: [{ type: 'email' }] } }, 'pas-un-mail');
    await (f.componentInstance as unknown as { validateNow(): Promise<boolean> }).validateNow();
    f.detectChanges();
    const err = el(f).querySelector('.ff-errors');
    expect(err?.getAttribute('role')).toBe('alert');
    const input = el(f).querySelector('input')!;
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-describedby')).toBe(err!.id);
  });

  it('select : option par défaut traduisible via ART_UI_TEXTS', () => {
    const f = mount({ name: 's', type: 'select', options: [{ value: 1, label: 'Un' }] });
    expect(el(f).querySelector('select option')?.textContent).toContain('-- Choisir --');
  });

  it('autocomplete : une nouvelle frappe annule la requête précédente (cancelKey)', async () => {
    const f = mount({ name: 'ac', type: 'autocomplete', autocompleteData: '/api/search' } as FormFieldConfig);
    const http = TestBed.inject(HttpTestingController);
    const c = f.componentInstance as unknown as { acQuery: string; triggerAcSearch(): void };
    c.acQuery = 'ab'; c.triggerAcSearch(); await flush();
    const first = http.match((r) => r.url.startsWith('/api/search'));
    c.acQuery = 'abc'; c.triggerAcSearch(); await flush();
    expect(first.every((r) => r.cancelled)).toBe(true);
    http.match(() => true).forEach((r) => !r.cancelled && r.flush([]));
  });

  it('a11y (axe) : champs texte, select, textarea avec explication et erreur', async () => {
    const f = mount({ name: 't', label: 'Texte', type: 'text', required: true, explanation: 'Aide' });
    await expectNoA11yViolations(el(f));
    const g = mount({ name: 'sel', label: 'Choix', type: 'select', options: [{ value: 1, label: 'Un' }] });
    await expectNoA11yViolations(el(g));
    const h = mount({ name: 'ta', label: 'Note', type: 'textarea' });
    await expectNoA11yViolations(el(h));
  });
});
