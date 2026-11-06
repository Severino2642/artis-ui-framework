import { TestBed } from '@angular/core/testing';
import { formatDuration, formatNombre } from '../../../core/models/format-number.model';
import { ArtDetailViewUtilsService } from '../../../detail/services/detail-view-utils/detail-view-utils.service';
import { ArtFormBuilderService } from '../../../form/services/form-builder/form-builder.service';
import { ColumnDef } from '../../models/data-list.model';
import { ArtDataListUtilsService } from './data-list-utils.service';

const cols: ColumnDef[] = [
  { key: 'name', title: 'Nom', sections: [{ fields: [{ attribute: 'name' }] }] },
  { key: 'price', title: 'Prix', sections: [{ fields: [{ attribute: 'price', type: 'number' }] }] },
  { key: 'date', title: 'Date', sections: [{ fields: [{ attribute: 'date', type: 'date' }] }] },
];
const rows = [
  { name: 'B', price: 20, date: '2026-03-05T10:00:00', cat: { label: 'x' } },
  { name: 'A', price: 5, date: '2026-01-01T00:00:00' },
  { name: '=cmd|\' /C calc\'!A0', price: 1500, date: null },
];

describe('ArtDataListUtilsService', () => {
  const svc = () => TestBed.inject(ArtDataListUtilsService);

  it('deepGet / formatDate', () => {
    expect(svc().deepGet(rows[0], 'cat.label')).toBe('x');
    expect(svc().deepGet(rows[1], 'cat.label') ?? null).toBeNull();
    expect(svc().formatDate('2026-03-05T10:04:09', 'dd/MM/yyyy HH:mm:ss')).toBe('05/03/2026 10:04:09');
    expect(svc().formatDate('', 'dd/MM/yyyy')).toBe('');
    expect(svc().formatDate('pas une date')).toBe('pas une date');
  });

  it('sortData : asc/desc, multi-clés, sans mutation', () => {
    const copy = [...rows];
    expect(svc().sortData(rows, [{ key: 'price', direction: 'asc' }]).map((r) => r.price)).toEqual([1, 5, 20].map((n) => (n === 1 ? 1500 : n)).sort((a, b) => a - b));
    expect(svc().sortData(rows, [{ key: 'name', direction: 'desc' }])[0].name).toBe('B');
    expect(svc().sortData(rows, [])).toBe(rows);
    expect(rows).toEqual(copy);
  });

  it('sortData : vides toujours en dernier, tri naturel du texte, dates, stabilité', () => {
    const d = [{ n: 'item 10', v: null }, { n: 'item 2', v: 3 }, { n: 'Item 1', v: undefined }, { n: 'item 3', v: 1 }, { n: '', v: 2 }];
    expect(svc().sortData(d, [{ key: 'n', direction: 'asc' }]).map((r) => r.n)).toEqual(['Item 1', 'item 2', 'item 3', 'item 10', '']);
    expect(svc().sortData(d, [{ key: 'n', direction: 'desc' }]).map((r) => r.n)).toEqual(['item 10', 'item 3', 'item 2', 'Item 1', '']);
    // les valeurs vides restent en dernier même en décroissant
    expect(svc().sortData(d, [{ key: 'v', direction: 'desc' }]).map((r) => r.v).slice(0, 3)).toEqual([3, 2, 1]);
    const dates = [{ d: new Date('2026-03-02') }, { d: new Date('2026-01-01') }];
    expect(svc().sortData(dates, [{ key: 'd', direction: 'asc' }])[0].d.getMonth()).toBe(0);
    // deux valeurs vides ne s'inversent pas (tri stable)
    const same = [{ a: 1, v: null }, { a: 2, v: null }];
    expect(svc().sortData(same, [{ key: 'v', direction: 'asc' }]).map((r) => r.a)).toEqual([1, 2]);
  });

  it('statistiques : count, sum, avg, min, max, customCalc', () => {
    const c = (calcMethod: any) => svc().computeStat({ title: 't', attribute: 'price', calcMethod }, rows);
    expect(c('count')).toBe(3);
    expect(Number(c('sum'))).toBe(1525);
    expect(Number(c('min'))).toBe(5);
    expect(Number(c('max'))).toBe(1500);
    expect(svc().computeStat({ title: 't', customCalc: (d) => d.length * 2 }, rows)).toBe(6);
    expect(svc().computeStat({ title: 't' }, rows)).toBe(3);
    expect(svc().computeAllStats([{ title: 'a', attribute: 'price', calcMethod: 'sum' }], rows).length).toBeGreaterThanOrEqual(1);
  });

  it('valeurs de cellule : nombre localisé, date, tronquage, badge', () => {
    expect(svc().getCellDisplayValue(rows[2], cols[1].sections[0].fields[0])).toContain('1');
    expect(svc().getCellDisplayValue(rows[0], cols[2].sections[0].fields[0])).toBe('05/03/2026');
    expect(svc().getCellDisplayValue(rows[2], cols[2].sections[0].fields[0])).toBe('');
    expect(svc().getCellDisplayValue({ t: 'un texte assez long pour être tronqué' }, { attribute: 't', maxLength: 12 })).toBe('un texte...');
    expect(svc().getBadgeColor('Actif', { attribute: 's', badgeColorMap: { actif: 'var(--art-success)' } })).toBe('var(--art-success)');
    expect(svc().getBadgeColor('?', { attribute: 's' })).toBe('var(--art-primary)');
  });

  it('flattenRow regroupe les champs par colonne', () => {
    expect(svc().flattenRow(rows[0], cols)['Nom']).toBe('B');
  });

  describe('exports', () => {
    let clicks: HTMLAnchorElement[];
    let blobs: Blob[];
    beforeEach(() => {
      clicks = []; blobs = [];
      vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) { clicks.push(this); });
      (URL as unknown as Record<string, unknown>)['createObjectURL'] = (b: Blob) => { blobs.push(b); return 'blob:x'; };
      (URL as unknown as Record<string, unknown>)['revokeObjectURL'] = () => undefined;
    });
    afterEach(() => vi.restoreAllMocks());

    it('CSV / Excel / XML / JSON déclenchent un téléchargement nommé', () => {
      svc().exportCSV(rows, cols, 'a.csv'); svc().exportExcel(rows, cols, 'a.xls'); svc().exportXML(rows, cols, 'a.xml'); svc().exportJSON(rows, cols, 'a.json');
      expect(clicks.map((a) => a.download)).toEqual(['a.csv', 'a.xls', 'a.xml', 'a.json']);
      expect(blobs.length).toBe(4);
    });

    it('anti-injection de formule : =, +, -, @ préfixés ; les nombres négatifs restent des nombres', () => {
      expect(svc().safeCell('=1+1')).toBe("'=1+1");
      expect(svc().safeCell('+cmd')).toBe("'+cmd");
      expect(svc().safeCell('@SUM(A1)')).toBe("'@SUM(A1)");
      expect(svc().safeCell('-5')).toBe('-5');
      expect(svc().safeCell('-1,5')).toBe('-1,5');
      expect(svc().safeCell('texte')).toBe('texte');
    });

    it('PDF : valeurs et titre échappés (pas de HTML injecté dans la fenêtre d’impression)', () => {
      let written = '';
      vi.spyOn(window, 'open').mockReturnValue({ document: { write: (h: string) => (written += h), close: () => undefined }, print: () => undefined } as unknown as Window);
      svc().exportPDF([{ name: '<img src=x onerror=alert(1)>', price: 1, date: null }], cols, '<script>x</script>');
      expect(written).not.toContain('<img src=x');
      expect(written).not.toContain('<script>x');
      expect(written).toContain('&lt;img src=x');
    });
  });
});

describe('format-number', () => {
  it('formatNombre : séparateurs, précision, compact, pourcentage, devise, signe, repli', () => {
    expect(formatNombre(1234567)).toBe('1\u202F234\u202F567');
    expect(formatNombre(1234.5, { precision: 2 })).toBe('1\u202F234,50');
    expect(formatNombre(0.1234, { percent: true, precision: 2 })).toBe('12,34\u202F%');
    expect(formatNombre(5000, { currency: '€' })).toContain('€');
    expect(formatNombre(5, { showSign: true })).toContain('+');
    expect(formatNombre(null)).toBe('—');
    expect(formatNombre('abc')).toBe('—');
    expect(formatNombre(1500000, { compact: true, precision: 1 })).toMatch(/1,5/);
  });
  it('formatDuration', () => {
    expect(typeof formatDuration({ value: 3600 } as never)).toBe('string');
  });
});

describe('ArtDetailViewUtilsService / ArtFormBuilderService', () => {
  it('detail : valeurs, badge, multibadge, liens', () => {
    const d = TestBed.inject(ArtDetailViewUtilsService);
    const data = { a: { b: 'x' }, n: 1234.5, d: '2026-03-05', tags: [{ nom: 'u' }, { nom: 'v' }], url: 'https://a.test' };
    expect(d.deepGet(data, 'a.b')).toBe('x');
    expect(d.getDisplayValue(data, { attribute: 'a.b' })).toBe('x');
    expect(d.getDisplayValue(data, { attribute: 'd', type: 'date' })).toBe('05/03/2026');
    expect(d.getDisplayValue(data, { attribute: 'zzz' })).toBeDefined();
    expect(d.getMultibadgeItems(data, { attribute: 'tags', type: 'multibadge', displayKey: 'nom' })).toEqual(['u', 'v']);
    expect(d.getBadgeColor('x', { attribute: 'a.b' })).toBe('var(--art-primary)');
    expect(d.resolveLink(data, { attribute: 'url', type: 'link', linkHref: '@url' })).toBe('https://a.test');
  });
  it('form-builder service : options depuis des objets', () => {
    const s = TestBed.inject(ArtFormBuilderService);
    expect(s.reformatToOptionValues([{ id: 1, n: 'A' }], 'id', 'n')).toEqual([{ value: '1', label: 'A' }]);
    expect(s.deepGet({ a: { b: 2 } }, 'a.b')).toBe(2);
  });
});
