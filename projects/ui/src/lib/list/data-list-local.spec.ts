import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideToaster } from '@artis/toaster';
import { expectNoA11yViolations, flush } from '../testing';
import { ArtDataListComponent } from './data-list/data-list.component';
import { DataListConfig } from './models/data-list.model';
import { ArtDataListUtilsService } from './services/data-list-utils/data-list-utils.service';

const DATA = [
  { name: 'Écran 4K', price: 400, status: 'actif', date: '2026-03-05T10:00:00', tags: ['a', 'b'] },
  { name: 'Clavier', price: 40, status: 'inactif', date: '2026-03-06T08:00:00', tags: ['b'] },
  { name: 'Souris', price: 25, status: 'actif', date: '2026-04-01T00:00:00', tags: [] },
  { name: 'Câble écran', price: 10, status: 'actif', date: null, tags: ['c'] },
  { name: 'Hub USB', price: 55, status: 'inactif', date: '2026-03-06T23:59:00', tags: ['a'] },
];
const cfg = (over: Partial<DataListConfig> = {}): DataListConfig => ({
  title: 'Produits', pageSize: 2, defaultViewMode: 'table', localMode: true,
  columns: [
    { key: 'name', title: 'Nom', sortable: true, filterable: true, sections: [{ fields: [{ attribute: 'name' }] }] },
    { key: 'price', title: 'Prix', sortable: true, filterable: true, sections: [{ fields: [{ attribute: 'price', type: 'number' }] }] },
    { key: 'status', title: 'Statut', filterable: true, sections: [{ fields: [{ attribute: 'status', type: 'badge', filterOnClick: true, badgeColorMap: { actif: 'var(--art-success)', inactif: 'var(--art-danger)' } }] }] },
    { key: 'date', title: 'Date', sections: [{ fields: [{ attribute: 'date', type: 'date' }] }] },
  ],
  ...over,
});

describe('ArtDataListUtilsService — filtrage', () => {
  const u = () => TestBed.inject(ArtDataListUtilsService);
  const names = (f: Record<string, unknown>, fields = u().autoFilterFields(cfg().columns, DATA)) => u().filterData(DATA, f, fields).map((r) => r.name);

  it('texte : insensible à la casse et aux accents, « contient » par défaut', () => {
    expect(names({ name: 'ecran' })).toEqual(['Écran 4K', 'Câble écran']);
    expect(names({ name: 'ÉCRAN' })).toEqual(['Écran 4K', 'Câble écran']);
  });
  it('filterMatch : startsWith / equals', () => {
    const f = [{ name: 'name', type: 'text', filterMatch: 'startsWith' } as never];
    expect(names({ name: 'ecr' }, f)).toEqual(['Écran 4K']);
    expect(names({ name: 'souris' }, [{ name: 'name', type: 'text', filterMatch: 'equals' } as never])).toEqual(['Souris']);
  });
  it('intervalle numérique : bornes incluses, une seule borne acceptée', () => {
    expect(names({ price: { min: 25, max: 55 } })).toEqual(['Clavier', 'Souris', 'Hub USB']);
    expect(names({ price: { min: 100, max: null } })).toEqual(['Écran 4K']);
    expect(names({ price: { min: null, max: 10 } })).toEqual(['Câble écran']);
  });
  it('intervalle de dates : la borne max inclut TOUTE la journée ; cellule vide exclue', () => {
    expect(names({ date: { min: '2026-03-06', max: '2026-03-06' } })).toEqual(['Clavier', 'Hub USB']);
    expect(names({ date: { min: '2026-03-01', max: null } })).not.toContain('Câble écran');
  });
  it('liste (badge) = égalité ; multiselect = OU ; cellule tableau = un élément suffit', () => {
    expect(names({ status: 'actif' })).toEqual(['Écran 4K', 'Souris', 'Câble écran']);
    expect(names({ status: ['actif', 'inactif'] })).toHaveLength(5);
    expect(u().filterData(DATA, { tags: 'a' }, [{ name: 'tags', type: 'select' } as never]).map((r) => r.name)).toEqual(['Écran 4K', 'Hub USB']);
  });
  it('plusieurs filtres = ET ; valeurs vides ignorées ; filterAttribute ; filterFn', () => {
    expect(names({ status: 'actif', price: { min: 20, max: null } })).toEqual(['Écran 4K', 'Souris']);
    expect(names({ name: '', price: { min: null, max: null }, status: [] })).toHaveLength(5);
    expect(u().filterData(DATA, { q: 'souris' }, [{ name: 'q', type: 'text', filterAttribute: 'name' } as never]).map((r) => r.name)).toEqual(['Souris']);
    expect(u().filterData(DATA, { x: 1 }, [], (r) => r.price > 100)).toHaveLength(1);
  });
  it('autoFilterFields : badge → liste avec options déduites ; nombre/date → intervalle ; personnalisation via filterable', () => {
    const f = u().autoFilterFields(cfg().columns, DATA);
    expect(f.find((x) => x.name === 'status')).toMatchObject({ type: 'select', options: [{ value: 'actif' }, { value: 'inactif' }] });
    expect(f.find((x) => x.name === 'price')).toMatchObject({ type: 'interval', intervalBaseType: 'number' });
    expect(f.find((x) => x.name === 'date')).toMatchObject({ type: 'interval', intervalBaseType: 'date' });
    const custom = u().columnFilterField({ key: 'n', title: 'N', filterable: { type: 'select', options: [{ value: 1, label: 'Un' }] }, sections: [{ fields: [{ attribute: 'n' }] }] });
    expect(custom).toMatchObject({ type: 'select', name: 'n' });
  });
});

describe('ArtDataListComponent — modes local et manuel', () => {
  let f: ComponentFixture<ArtDataListComponent>;
  let c: ArtDataListComponent;
  const el = () => f.nativeElement as HTMLElement;
  const rows = () => Array.from(el().querySelectorAll('tbody tr.dlt-tr')).map((r) => r.querySelectorAll('td.dlt-td')[1]?.textContent?.trim());

  const mount = (config: DataListConfig, data = DATA) => {
    f = TestBed.createComponent(ArtDataListComponent);
    c = f.componentInstance;
    f.componentRef.setInput('config', config);
    f.componentRef.setInput('data', data);
    f.detectChanges();
  };
  beforeEach(() => TestBed.configureTestingModule({ providers: [provideRouter([]), provideToaster(), provideHttpClient(), provideHttpClientTesting()] }));

  it('MODE LOCAL : le framework filtre, trie et pagine ; les événements sont aussi émis', () => {
    mount(cfg({ pageSize: 10 }));
    const filterSpy = vi.fn(); const sortSpy = vi.fn();
    c.filterApply.subscribe(filterSpy); c.sortChange.subscribe(sortSpy);
    c.onFilterApply({ status: 'actif' });
    expect(c.processedData.map((r) => r.name)).toEqual(['Écran 4K', 'Souris', 'Câble écran']);
    expect(c.activeFilterCount).toBe(1);
    c.onSortChange([{ key: 'price', direction: 'asc' }]);
    expect(c.processedData.map((r) => r.price)).toEqual([10, 25, 400]);
    expect(filterSpy).toHaveBeenCalledWith({ status: 'actif' });
    expect(sortSpy).toHaveBeenCalledOnce();
  });

  it('le total et les statistiques se recalculent sur les données filtrées ; retour à la page 1', () => {
    mount(cfg());
    c.onPageChange({ start: 2, end: 4, page: 2, pageSize: 2 });
    expect(c.currentPage).toBe(2);
    c.onFilterApply({ name: 'ecran' });
    expect(c.currentPage).toBe(1);
    expect(c.computedStats[0].computedValue).toBe(2);
    f.detectChanges();
    expect(rows()).toEqual(['Écran 4K', 'Câble écran']);
  });

  it('MODE MANUEL (sans localMode) : rien n’est recalculé, seuls les événements partent — le parent fournit les données', () => {
    mount(cfg({ localMode: false }));
    const filterSpy = vi.fn(); c.filterApply.subscribe(filterSpy);
    c.onFilterApply({ status: 'actif' });
    c.onSortChange([{ key: 'price', direction: 'desc' }]);
    expect(c.processedData).toHaveLength(5);
    expect(c.processedData.map((r) => r.name)).toEqual(DATA.map((r) => r.name));
    expect(filterSpy).toHaveBeenCalledWith({ status: 'actif' });
    // le parent répond avec de nouvelles données → affichées telles quelles
    f.componentRef.setInput('data', DATA.filter((r) => r.status === 'actif'));
    f.detectChanges();
    expect(c.processedData).toHaveLength(3);
  });

  it('options indépendantes : localMode + isAutoFiltered:false = tri local, filtre manuel', () => {
    mount(cfg({ isAutoFiltered: false }));
    c.onFilterApply({ status: 'actif' });
    c.onSortChange([{ key: 'price', direction: 'asc' }]);
    expect(c.processedData).toHaveLength(5);
    expect(c.processedData[0].price).toBe(10);
  });

  it('filterFn personnalisé en mode local', () => {
    mount(cfg({ filterFn: (row, filters) => row.price >= Number(filters['min']) }));
    c.onFilterApply({ min: 100 });
    expect(c.processedData.map((r) => r.name)).toEqual(['Écran 4K']);
  });

  it('EN-TÊTE : clic sur l’icône de tri → croissant, décroissant, aucun ; aria-sort mis à jour', () => {
    mount(cfg({ pageSize: 10 }));
    const th = () => el().querySelectorAll('thead th')[3] as HTMLElement; // # + checkbox? : N°, Nom, Prix …
    const priceTh = Array.from(el().querySelectorAll<HTMLElement>('thead th')).find((t) => t.textContent?.includes('Prix'))!;
    const btn = () => priceTh.querySelector<HTMLButtonElement>('.dlt-th-btn')!;
    expect(priceTh.getAttribute('aria-sort')).toBe('none');
    expect(btn().getAttribute('aria-label')).toBe('Trier par Prix');
    btn().click(); f.detectChanges();
    expect(priceTh.getAttribute('aria-sort')).toBe('ascending');
    expect(rows()).toEqual(['Câble écran', 'Souris', 'Clavier', 'Hub USB', 'Écran 4K']);
    btn().click(); f.detectChanges();
    expect(priceTh.getAttribute('aria-sort')).toBe('descending');
    expect(rows()[0]).toBe('Écran 4K');
    btn().click(); f.detectChanges();
    expect(priceTh.getAttribute('aria-sort')).toBe('none');
    expect(rows()[0]).toBe('Écran 4K'); // ordre d'origine
    void th;
  });

  it('EN-TÊTE : l’icône de filtre ouvre un panneau ; appliquer filtre, effacer rétablit', async () => {
    mount(cfg({ pageSize: 10 }));
    const nameTh = Array.from(el().querySelectorAll<HTMLElement>('thead th')).find((t) => t.textContent?.includes('Nom'))!;
    const btn = nameTh.querySelector<HTMLButtonElement>('.cfl__btn')!;
    expect(btn.getAttribute('aria-label')).toBe('Filtrer la colonne Nom');
    expect(btn.getAttribute('aria-haspopup')).toBe('dialog');
    btn.click(); f.detectChanges(); await flush(); f.detectChanges();
    const panel = el().querySelector<HTMLElement>('.cfl__panel')!;
    expect(panel.getAttribute('role')).toBe('dialog');
    const input = panel.querySelector<HTMLInputElement>('input')!;
    input.value = 'ecran'; input.dispatchEvent(new Event('input')); f.detectChanges();
    panel.querySelector<HTMLButtonElement>('.cfl__apply')!.click(); f.detectChanges();
    expect(rows()).toEqual(['Écran 4K', 'Câble écran']);
    expect(c.activeFilters).toEqual({ name: 'ecran' });
    expect(nameTh.querySelector('.cfl__btn--on')).not.toBeNull();
    expect(el().querySelector('.dl-filter-badge')?.textContent?.trim()).toBe('1');
    // effacer
    nameTh.querySelector<HTMLButtonElement>('.cfl__btn')!.click(); f.detectChanges(); await flush(); f.detectChanges();
    el().querySelector<HTMLButtonElement>('.cfl__clear')!.click(); f.detectChanges();
    expect(rows()).toHaveLength(5);
    expect(c.activeFilterCount).toBe(0);
  });

  it('CLIC SUR UNE VALEUR (filterOnClick) : filtre par égalité ; un second clic retire le filtre', () => {
    mount(cfg({ pageSize: 10 }));
    const badge = () => el().querySelectorAll<HTMLElement>('tbody .dlt-badge.dlt-clickable');
    expect(badge()[0].getAttribute('role')).toBe('button');
    expect(badge()[0].getAttribute('title')).toContain('filtrer');
    const inactif = Array.from(badge()).find((b) => b.textContent?.includes('inactif'))!;
    inactif.click(); f.detectChanges();
    expect(rows()).toEqual(['Clavier', 'Hub USB']);
    expect(el().querySelector('.dlt-badge.dlt-clickable')?.getAttribute('aria-pressed')).toBe('true');
    el().querySelector<HTMLElement>('.dlt-badge.dlt-clickable')!.click(); f.detectChanges();
    expect(rows()).toHaveLength(5);
  });

  it('un filtre posé par l’en-tête apparaît dans le panneau de filtres (valeurs synchronisées)', () => {
    mount(cfg());
    c.onColumnFilter({ field: 'status', value: 'actif' });
    expect(c.activeFilters).toEqual({ status: 'actif' });
    expect(c.filterActive).toBe(true);
  });

  it('a11y (axe) du tableau avec tri et filtres de colonne', async () => {
    mount(cfg({ pageSize: 10 }));
    await expectNoA11yViolations(el().querySelector('table')!, ['nested-interactive', 'scrollable-region-focusable', 'empty-table-header']);
  });
});
