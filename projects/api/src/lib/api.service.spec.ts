import { HttpEventType, HttpHeaders } from '@angular/common/http';
import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ApiService } from './api.service';
import { apiTestProviders } from './test-utils';

describe('ApiService', () => {
  let api: ApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: apiTestProviders({ csrf: { cookieName: 'XSRF-TOKEN', headerName: 'X-XSRF-TOKEN' } }) });
    api = TestBed.inject(ApiService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => { http.verify(); document.cookie = 'XSRF-TOKEN=; expires=Thu, 01 Jan 1970 00:00:00 GMT'; });

  it('préfixe baseUrl, ajoute X-Request-Id et ignore les paramètres vides', () => {
    api.get('/items', { params: { a: 1, b: '', c: null, d: [1, 2] } }).subscribe();
    const r = http.expectOne((x) => x.url === 'https://api.test/items');
    expect(r.request.params.getAll('d')).toEqual(['1', '2']);
    expect(r.request.params.has('b')).toBe(false);
    expect(r.request.params.has('c')).toBe(false);
    expect(r.request.headers.get('X-Request-Id')).toMatch(/[0-9a-f-]{16,}/i);
    r.flush({});
  });

  it('ne préfixe pas deux fois un chemin qui commence déjà par baseUrl', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: apiTestProviders({ baseUrl: '/api' }) });
    const a = TestBed.inject(ApiService);
    expect(a.buildUrl('/upload')).toBe('/api/upload');
    expect(a.buildUrl('/api/upload')).toBe('/api/upload');
    expect(a.buildUrl('/apiary')).toBe('/api/apiary');
  });

  it('laisse passer les URL absolues telles quelles', () => {
    expect(api.buildUrl('https://autre.test/x')).toBe('https://autre.test/x');
    expect(api.buildUrl('x')).toBe('https://api.test/x');
  });

  it('post / put / patch / delete', () => {
    api.post('/a', { x: 1 }).subscribe();
    api.put('/a/1', { x: 2 }).subscribe();
    api.patch('/a/1', { x: 3 }).subscribe();
    api.delete('/a/1').subscribe();
    const methods = ['POST', 'PUT', 'PATCH', 'DELETE'].map((m) => http.expectOne((r) => r.method === m));
    expect(methods.length).toBe(4);
    methods.forEach((m) => m.flush({}));
  });

  it('list() applique le contrat page/pageSize/sort/filter/q et normalise la réponse', () => {
    let page: unknown;
    api.list('/clients', { page: 2, pageSize: 10, sort: [{ field: 'name', direction: 'asc' }, { field: 'age', direction: 'desc' }], filters: { status: 'ok', tags: ['a', 'b'], empty: '' }, search: ' acme ' }).subscribe((p) => (page = p));
    const r = http.expectOne((x) => x.url === 'https://api.test/clients');
    expect(r.request.params.get('page')).toBe('2');
    expect(r.request.params.get('pageSize')).toBe('10');
    expect(r.request.params.get('sort')).toBe('name:asc,age:desc');
    expect(r.request.params.get('filter[status]')).toBe('ok');
    expect(r.request.params.getAll('filter[tags]')).toEqual(['a', 'b']);
    expect(r.request.params.has('filter[empty]')).toBe(false);
    expect(r.request.params.get('q')).toBe('acme');
    r.flush({ content: [{ id: 1 }], totalElements: 41 });
    expect(page).toEqual({ items: [{ id: 1 }], total: 41, page: 2, pageSize: 10 });
  });

  it('cancelKey : un nouvel appel annule le précédent', () => {
    api.get('/search', { params: { q: 'a' }, cancelKey: 'k' }).subscribe();
    const first = http.expectOne((r) => r.params.get('q') === 'a');
    api.get('/search', { params: { q: 'ab' }, cancelKey: 'k' }).subscribe();
    expect(first.cancelled).toBe(true);
    http.expectOne((r) => r.params.get('q') === 'ab').flush([]);
  });

  it('signal (AbortController) annule la requête', () => {
    const ctrl = new AbortController();
    api.get('/slow', { signal: ctrl.signal }).subscribe();
    const r = http.expectOne('https://api.test/slow');
    ctrl.abort();
    expect(r.cancelled).toBe(true);
  });

  it('cancelAll annule toutes les requêtes en cours', () => {
    api.get('/a').subscribe();
    api.get('/b').subscribe();
    const reqs = [http.expectOne('https://api.test/a'), http.expectOne('https://api.test/b')];
    api.cancelAll();
    expect(reqs.every((r) => r.cancelled)).toBe(true);
  });

  it('upload() émet la progression puis la réponse', () => {
    const events: unknown[] = [];
    api.upload('/upload', new File(['x'], 'a.txt'), { fields: { folder: 'docs' } }).subscribe((e) => events.push(e));
    const r = http.expectOne('https://api.test/upload');
    expect((r.request.body as FormData).get('folder')).toBe('docs');
    expect((r.request.body as FormData).get('file')).toBeInstanceOf(File);
    r.event({ type: HttpEventType.UploadProgress, loaded: 50, total: 100 });
    r.flush({ id: 7 });
    expect(events).toEqual([
      { type: 'progress', loaded: 50, total: 100, percent: 50 },
      { type: 'done', body: { id: 7 } },
    ]);
  });

  it('variantes Promise', async () => {
    const p = api.getAsync<{ ok: boolean }>('/ping');
    http.expectOne('https://api.test/ping').flush({ ok: true });
    expect(await p).toEqual({ ok: true });
  });

  it('CSRF : en-tête double-submit sur POST seulement', () => {
    document.cookie = 'XSRF-TOKEN=tok123';
    api.get('/a').subscribe();
    expect(http.expectOne('https://api.test/a').request.headers.has('X-XSRF-TOKEN')).toBe(false);
    api.post('/b', {}).subscribe();
    const post = http.expectOne('https://api.test/b');
    expect(post.request.headers.get('X-XSRF-TOKEN')).toBe('tok123');
    http.match(() => true).forEach((r) => r.flush({}));
  });

  it('n’envoie jamais l’en-tête CSRF ni X-Request-Id vers un domaine tiers', () => {
    api.post('https://tiers.test/x', {}).subscribe();
    const r = http.expectOne('https://tiers.test/x');
    expect(r.request.headers.has('X-XSRF-TOKEN')).toBe(false);
    expect(r.request.headers.has('X-Request-Id')).toBe(false);
    r.flush({});
    void HttpHeaders;
  });
});
