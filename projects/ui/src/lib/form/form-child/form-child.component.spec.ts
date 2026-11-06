import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { expectNoA11yViolations } from '../../testing';
import { ChildFormConfig } from '../models/form-builder.model';
import { ArtFormChildComponent } from './form-child.component';

describe('ArtFormChildComponent — actions de lignes en-tête / pied', () => {
  let f: ComponentFixture<ArtFormChildComponent>;
  let c: ArtFormChildComponent;
  const el = () => f.nativeElement as HTMLElement;
  const btns = (zone: '.fc-header-right' | '.fc-rows-footer-actions') =>
    Array.from(el().querySelector(zone)?.querySelectorAll<HTMLButtonElement>('button.fc-btn') ?? []).map((b) => b.textContent?.replace(/\s+/g, ' ').trim());

  const mount = (config: Partial<ChildFormConfig> = {}, rows: Record<string, unknown>[] = []) => {
    f = TestBed.createComponent(ArtFormChildComponent);
    c = f.componentInstance;
    f.componentRef.setInput('config', { title: 'Lignes', fields: [{ name: 'label', label: 'Libellé', type: 'text', explanation: 'Nom de la ligne' }, { name: 'qty', type: 'number', defaultValue: 1 }], ...config });
    f.componentRef.setInput('rows', rows);
    f.detectChanges();
  };
  beforeEach(() => TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] }));

  it('le pied n’apparaît qu’avec des lignes ; l’en-tête garde « Ajouter une ligne »', () => {
    mount();
    expect(el().querySelector('.fc-rows-footer')).toBeNull();
    expect(btns('.fc-header-right')).toContain('add Ajouter une ligne');
    c.addRow(); f.detectChanges();
    expect(el().querySelector('.fc-rows-footer')).not.toBeNull();
  });

  it('en-tête et pied proposent les MÊMES boutons : Ajouter 10 lignes, Ajouter une ligne (+ Supprimer si sélection)', () => {
    mount({}, [{ label: 'a', qty: 1 }, { label: 'b', qty: 2 }]);
    const labels = (z: '.fc-header-right' | '.fc-rows-footer-actions') => btns(z).filter((t) => /Ajouter|Supprimer/.test(t!));
    expect(labels('.fc-header-right')).toEqual(labels('.fc-rows-footer-actions'));
    expect(labels('.fc-rows-footer-actions')).toEqual(['playlist_add Ajouter 10 lignes', 'add Ajouter une ligne']);
    c.toggleRowSelection(0); f.detectChanges();
    expect(labels('.fc-header-right')).toEqual(labels('.fc-rows-footer-actions'));
    expect(labels('.fc-rows-footer-actions')[0]).toContain('Supprimer (1)');
  });

  it('pied : « Ajouter 10 lignes » ajoute 10 lignes vierges avec valeurs par défaut, en UNE émission', () => {
    mount({}, [{ label: 'a', qty: 1 }]);
    const emitted: unknown[] = []; c.rowsChange.subscribe((r) => emitted.push(r.length));
    el().querySelector<HTMLButtonElement>('.fc-rows-footer-actions button[aria-label="Ajouter 10 lignes"]')!.click(); f.detectChanges();
    expect(c.rows).toHaveLength(11);
    expect(c.rows[10]).toMatchObject({ label: null, qty: 1 });
    expect(emitted).toEqual([11]);
  });

  it('pied : « Ajouter une ligne » et « Supprimer » fonctionnent comme dans l’en-tête', () => {
    mount({}, [{ label: 'a', qty: 1 }, { label: 'b', qty: 2 }]);
    const footer = () => Array.from(el().querySelectorAll<HTMLButtonElement>('.fc-rows-footer-actions button'));
    footer().find((b) => b.textContent?.includes('Ajouter une ligne'))!.click(); f.detectChanges();
    expect(c.rows).toHaveLength(3);
    c.toggleRowSelection(0); c.toggleRowSelection(1); f.detectChanges();
    footer().find((b) => b.textContent?.includes('Supprimer (2)'))!.click(); f.detectChanges();
    expect(c.rows).toHaveLength(1);
    expect(footer().some((b) => b.textContent?.includes('Supprimer'))).toBe(false);
  });

  it('bulkAddCount configurable (0 masque le bouton)', () => {
    mount({ bulkAddCount: 5 }, [{ label: 'a' }]);
    expect(btns('.fc-rows-footer-actions')[0]).toContain('Ajouter 5 lignes');
    c.addRows(5); f.detectChanges(); expect(c.rows).toHaveLength(6);
    mount({ bulkAddCount: 0 }, [{ label: 'a' }]);
    expect(btns('.fc-rows-footer-actions').join()).not.toContain('lignes');
  });

  it('maxRows : l’ajout groupé est tronqué et les boutons se désactivent à la limite ; compteur affiché', () => {
    mount({ maxRows: 12 }, [{ label: 'a' }]);
    expect(el().querySelector('.fc-rows-footer-info')?.textContent).toContain('1 / 12');
    c.addRows(10); f.detectChanges();
    expect(c.rows).toHaveLength(11);
    c.addRows(10); f.detectChanges();
    expect(c.rows).toHaveLength(12);
    expect(el().querySelector<HTMLButtonElement>('.fc-rows-footer-actions .fc-btn--primary')!.disabled).toBe(true);
    c.addRow(); f.detectChanges(); expect(c.rows).toHaveLength(12);
  });

  it('en-tête de colonne : explication contextuelle disponible', () => {
    mount({}, [{ label: 'a' }]);
    expect(el().querySelector('thead art-info-tip')).not.toBeNull();
  });

  it('a11y (axe) des boutons de pied', async () => {
    mount({}, [{ label: 'a', qty: 1 }]);
    await expectNoA11yViolations(el().querySelector('.fc-rows-footer')!);
  });
});
