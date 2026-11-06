import { DEFAULT_API_CONFIG } from './api.config';
import { buildListParams, defaultMapPage } from './list-params';
import { escapeHtml, sanitizeUrl } from './security/sanitize';

describe('list-params', () => {
  const c = DEFAULT_API_CONFIG.listContract;
  it('contrat personnalisable', () => {
    const p = buildListParams({ page: 1, sort: [{ field: 'a', direction: 'asc' }], filters: { x: 1 } }, { ...c, pageParam: 'p', sortParam: 'order', filterParam: (k) => `f_${k}` });
    expect(p).toEqual({ p: 1, order: 'a:asc', f_x: 1 });
  });
  it('defaultMapPage accepte tableau, items/total, data/count', () => {
    expect(defaultMapPage([1, 2], {})).toEqual({ items: [1, 2], total: 2, page: 1, pageSize: 2 });
    expect(defaultMapPage({ data: [1], count: 9 }, { page: 3, pageSize: 1 })).toEqual({ items: [1], total: 9, page: 3, pageSize: 1 });
    expect(defaultMapPage(null, {}).items).toEqual([]);
  });
});

describe('sécurité XSS', () => {
  it('escapeHtml', () => expect(escapeHtml(`<img src=x onerror="a('b')">&`)).toBe('&lt;img src=x onerror=&quot;a(&#39;b&#39;)&quot;&gt;&amp;'));
  it.each([['javascript:alert(1)'], ['  JaVaScRiPt:alert(1)'], ['data:text/html,<script>'], ['vbscript:x'], ['java\nscript:alert(1)']])('sanitizeUrl bloque %s', (u) => expect(sanitizeUrl(u)).toBeNull());
  it.each([['https://a.test/x'], ['http://a.test'], ['mailto:a@b.c'], ['tel:+33123'], ['/relatif'], ['page.html'], ['#ancre']])('sanitizeUrl accepte %s', (u) => expect(sanitizeUrl(u)).toBe(u));
  it('sanitizeUrl : vide → null', () => { expect(sanitizeUrl('')).toBeNull(); expect(sanitizeUrl(null)).toBeNull(); });
});
