import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { apiTestProviders, fakeJwt } from '../test-utils';
import { SessionService, decodeJwtPayload, defaultMapAuthResponse } from './session.service';
import { MemoryTokenStorage, WebTokenStorage } from './token-storage';

describe('SessionService', () => {
  let s: SessionService;
  let http: HttpTestingController;

  const init = (cfg = {}) => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: apiTestProviders(cfg) });
    s = TestBed.inject(SessionService);
    http = TestBed.inject(HttpTestingController);
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
  };

  it('login : stocke les jetons, décode les claims, passe authentifié', () => {
    init();
    const token = fakeJwt(3600, { name: 'Ada', roles: ['admin'] });
    s.login({ u: 'ada', p: 'x' }).subscribe();
    const r = http.expectOne('https://api.test/auth/login');
    expect(r.request.body).toEqual({ u: 'ada', p: 'x' });
    r.flush({ accessToken: token, refreshToken: 'rt' });
    expect(s.isAuthenticated()).toBe(true);
    expect(s.accessToken).toBe(token);
    expect((s.user() as Record<string, unknown>)['name']).toBe('Ada');
    expect(s.expiresAt).toBeGreaterThan(Date.now());
  });

  it('logout : prévient le serveur, vide tout, redirige', () => {
    init();
    s.setTokens({ accessToken: fakeJwt(3600), refreshToken: 'rt' });
    s.logout();
    http.expectOne('https://api.test/auth/logout').flush({});
    expect(s.status()).toBe('anonymous');
    expect(s.accessToken).toBeNull();
    expect(s.refreshToken).toBeNull();
    expect(TestBed.inject(Router).navigate).toHaveBeenCalledWith(['/login']);
  });

  it('isTokenExpired tient compte de la marge', () => {
    init();
    s.setTokens({ accessToken: fakeJwt(20) });
    expect(s.isTokenExpired(0)).toBe(false);
    expect(s.isTokenExpired(30)).toBe(true);
  });

  it('stockage mémoire : rien dans localStorage / sessionStorage', () => {
    init({ storage: 'memory' });
    s.setTokens({ accessToken: fakeJwt(60) });
    expect(sessionStorage.length + localStorage.length).toBe(0);
  });

  it('stockage sessionStorage : restauré par une nouvelle instance', () => {
    sessionStorage.clear();
    init({ storage: 'sessionStorage' });
    s.setTokens({ accessToken: fakeJwt(3600) });
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: apiTestProviders({ storage: 'sessionStorage' }) });
    expect(TestBed.inject(SessionService).isAuthenticated()).toBe(true);
    sessionStorage.clear();
  });

  it('session restaurée expirée sans refresh token → expired', () => {
    sessionStorage.clear();
    sessionStorage.setItem('art.access', fakeJwt(-100));
    sessionStorage.setItem('art.expires', String(Date.now() - 1000));
    init({ storage: 'sessionStorage' });
    expect(s.status()).toBe('expired');
    sessionStorage.clear();
  });

  it('refresh : sans refresh token → erreur', () => {
    init();
    let err: unknown;
    s.refresh().subscribe({ error: (e) => (err = e) });
    expect(err).toBeInstanceOf(Error);
  });

  it('mapAuthResponse personnalisable', () => {
    init({ mapAuthResponse: (b: unknown) => ({ accessToken: (b as { jeton: string }).jeton }) });
    s.login({}).subscribe();
    http.expectOne('https://api.test/auth/login').flush({ jeton: fakeJwt(100) });
    expect(s.isAuthenticated()).toBe(true);
  });

  describe('utilitaires', () => {
    it('decodeJwtPayload tolère les jetons invalides', () => {
      expect(decodeJwtPayload('nimportequoi')).toBeNull();
      expect(decodeJwtPayload(fakeJwt(10, { a: 1 }))?.['a']).toBe(1);
    });
    it('defaultMapAuthResponse : formats courants et expires_in', () => {
      const p = defaultMapAuthResponse({ data: { access_token: 'a.b.c', refresh_token: 'r', expires_in: 60 } });
      expect(p.accessToken).toBe('a.b.c');
      expect(p.refreshToken).toBe('r');
      expect(p.expiresAt).toBeGreaterThan(Date.now());
      expect(() => defaultMapAuthResponse({})).toThrow();
    });
    it('MemoryTokenStorage et WebTokenStorage', () => {
      const m = new MemoryTokenStorage();
      m.set('k', 'v'); expect(m.get('k')).toBe('v'); m.remove('k'); expect(m.get('k')).toBeNull();
      const w = new WebTokenStorage('sessionStorage');
      w.set('k', 'v'); expect(sessionStorage.getItem('k')).toBe('v'); w.remove('k'); expect(w.get('k')).toBeNull();
    });
  });
});
