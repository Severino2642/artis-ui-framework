import { HttpClient, HttpContext } from '@angular/common/http';
import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ToastService } from '@artis/toaster';
import { SKIP_AUTH, SKIP_ERROR_TOAST, SKIP_LOADER } from '../api.config';
import { ApiError } from '../errors/api-error';
import { LoaderService } from '../loader/loader.service';
import { SessionService } from '../session/session.service';
import { apiTestProviders, fakeJwt } from '../test-utils';
import { ApiService } from '../api.service';

describe('Intercepteurs (intégration)', () => {
  let http: HttpTestingController;
  let api: ApiService;
  let session: SessionService;
  let toast: ToastService;
  let router: Router;

  function setup(config = {}) {
    TestBed.configureTestingModule({
      providers: apiTestProviders({
        businessErrors: { BILLING_RESTRICTED: { message: 'Facturation restreinte. {detail}', title: 'Facturation', action: { label: 'Voir', route: '/billing' } }, SILENT: { message: 'x', silent: true } },
        loaderExcludedUrls: ['/poll'],
        ...config,
      }),
    });
    http = TestBed.inject(HttpTestingController);
    api = TestBed.inject(ApiService);
    session = TestBed.inject(SessionService);
    toast = TestBed.inject(ToastService);
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
  }
  afterEach(() => http.verify());

  describe('authentification', () => {
    it('joint le Bearer aux appels vers le backend uniquement', () => {
      setup();
      session.setTokens({ accessToken: fakeJwt(3600) });
      api.get('/me').subscribe();
      expect(http.expectOne('https://api.test/me').request.headers.get('Authorization')).toMatch(/^Bearer /);
      TestBed.inject(HttpClient).get('https://tiers.test/data').subscribe();
      const tiers = http.expectOne('https://tiers.test/data');
      expect(tiers.request.headers.has('Authorization')).toBe(false);
      http.match(() => true).forEach((r) => r.flush({}));
    });

    it('SKIP_AUTH : aucun jeton joint', () => {
      setup();
      session.setTokens({ accessToken: fakeJwt(3600) });
      TestBed.inject(HttpClient).get('https://api.test/public', { context: new HttpContext().set(SKIP_AUTH, true) }).subscribe();
      const r = http.expectOne('https://api.test/public');
      expect(r.request.headers.has('Authorization')).toBe(false);
      r.flush({});
    });

    it('401 → refresh automatique → la requête est rejouée avec le nouveau jeton', () => {
      setup();
      session.setTokens({ accessToken: fakeJwt(3600), refreshToken: 'rt1' });
      let result: unknown;
      api.get('/secure').subscribe((v) => (result = v));
      http.expectOne('https://api.test/secure').flush({}, { status: 401, statusText: 'Unauthorized' });
      const refresh = http.expectOne('https://api.test/auth/refresh');
      expect(refresh.request.headers.has('Authorization')).toBe(false);
      const newToken = fakeJwt(7200);
      refresh.flush({ access_token: newToken, refresh_token: 'rt2' });
      const retry = http.expectOne('https://api.test/secure');
      expect(retry.request.headers.get('Authorization')).toBe(`Bearer ${newToken}`);
      retry.flush({ ok: 1 });
      expect(result).toEqual({ ok: 1 });
      expect(session.refreshToken).toBe('rt2');
    });

    it('plusieurs 401 simultanés ne déclenchent qu’UN seul refresh', () => {
      setup();
      session.setTokens({ accessToken: fakeJwt(3600), refreshToken: 'rt1' });
      api.get('/a').subscribe();
      api.get('/b').subscribe();
      http.expectOne('https://api.test/a').flush({}, { status: 401, statusText: 'x' });
      http.expectOne('https://api.test/b').flush({}, { status: 401, statusText: 'x' });
      const refreshes = http.match('https://api.test/auth/refresh');
      expect(refreshes.length).toBe(1);
      refreshes[0].flush({ accessToken: fakeJwt(3600) });
      http.match(() => true).forEach((r) => r.flush({}));
    });

    it('refresh impossible → session expirée, toast, redirection login', () => {
      setup();
      session.setTokens({ accessToken: fakeJwt(3600), refreshToken: 'rt1' });
      let err: unknown;
      api.get('/secure').subscribe({ error: (e) => (err = e) });
      http.expectOne('https://api.test/secure').flush({}, { status: 401, statusText: 'x' });
      http.expectOne('https://api.test/auth/refresh').flush({}, { status: 401, statusText: 'x' });
      expect(session.status()).toBe('expired');
      expect(session.accessToken).toBeNull();
      expect(router.navigate).toHaveBeenCalledWith(['/login'], expect.anything());
      expect(toast.all().some((t) => t.id === 'art-session-expired')).toBe(true);
      expect(err).toBeInstanceOf(ApiError);
    });

    it('401 sans refresh token → expiration directe', () => {
      setup();
      session.setTokens({ accessToken: fakeJwt(3600) });
      api.get('/secure').subscribe({ error: () => undefined });
      http.expectOne('https://api.test/secure').flush({}, { status: 401, statusText: 'x' });
      expect(session.status()).toBe('expired');
    });

    it('jeton expiré + refresh token → refresh proactif avant l’appel', () => {
      setup();
      session.setTokens({ accessToken: fakeJwt(-10), refreshToken: 'rt1', expiresAt: Date.now() - 10_000 });
      api.get('/me').subscribe();
      const refresh = http.expectOne('https://api.test/auth/refresh');
      refresh.flush({ accessToken: fakeJwt(3600) });
      http.expectOne('https://api.test/me').flush({});
    });
  });

  describe('erreurs & toasts', () => {
    it.each([
      [400, 'validation', 'warning'], [403, 'forbidden', 'error'], [404, 'not-found', 'warning'], [409, 'conflict', 'warning'],
      [422, 'validation', 'warning'], [500, 'server', 'error'], [503, 'unavailable', 'error'],
    ])('HTTP %i → ApiError(%s) + toast %s', (status, kind, severity) => {
      setup();
      let err: ApiError | undefined;
      api.get('/x').subscribe({ error: (e) => (err = e) });
      http.expectOne('https://api.test/x').flush({}, { status, statusText: 'x' });
      expect(err).toBeInstanceOf(ApiError);
      expect(err!.kind).toBe(kind);
      expect(err!.status).toBe(status);
      expect(toast.all().length).toBe(1);
      expect(toast.all()[0].type).toBe(severity);
      expect(toast.all()[0].message.length).toBeGreaterThan(5);
    });

    it('erreur réseau (status 0)', () => {
      setup();
      let err: ApiError | undefined;
      api.get('/x').subscribe({ error: (e) => (err = e) });
      http.expectOne('https://api.test/x').error(new ProgressEvent('error'));
      expect(err!.kind).toBe('network');
      expect(toast.all()[0].message).toContain('Impossible de joindre le serveur');
    });

    it('RFC 7807 : extrait detail, title, erreurs par champ, traceId', () => {
      setup();
      let err: ApiError | undefined;
      api.get('/x').subscribe({ error: (e) => (err = e) });
      http.expectOne('https://api.test/x').flush(
        { type: 'https://e.test/v', title: 'Validation failed', status: 422, detail: 'technique', errors: { email: ['Invalide'], name: 'Requis' }, traceId: 'T-1' },
        { status: 422, statusText: 'x', headers: { 'Content-Type': 'application/problem+json' } },
      );
      expect(err!.title).toBe('Validation failed');
      expect(err!.detail).toBe('technique');
      expect(err!.fieldErrors).toEqual({ email: ['Invalide'], name: ['Requis'] });
      expect(err!.traceId).toBe('T-1');
      // le message affiché n'est PAS le détail technique du serveur
      expect(err!.message).not.toContain('technique');
      expect(toast.all()[0].message).toContain('Invalide');
    });

    it('code métier configuré → message, titre, action', () => {
      setup();
      let err: ApiError | undefined;
      api.get('/x').subscribe({ error: (e) => (err = e) });
      http.expectOne('https://api.test/x').flush({ code: 'BILLING_RESTRICTED', detail: 'Plan expiré' }, { status: 402, statusText: 'x' });
      expect(err!.kind).toBe('business');
      expect(err!.code).toBe('BILLING_RESTRICTED');
      expect(err!.message).toBe('Facturation restreinte. Plan expiré');
      const t = toast.all()[0];
      expect(t.title).toBe('Facturation');
      const nav = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
      t.action!.handler();
      expect(nav).toHaveBeenCalledWith('/billing');
    });

    it('code métier « silent » : erreur propagée sans toast', () => {
      setup();
      let err: ApiError | undefined;
      api.get('/x').subscribe({ error: (e) => (err = e) });
      http.expectOne('https://api.test/x').flush({ code: 'SILENT' }, { status: 400, statusText: 'x' });
      expect(err!.code).toBe('SILENT');
      expect(toast.all().length).toBe(0);
    });

    it('SKIP_ERROR_TOAST et toastOnError:false désactivent le toast', () => {
      setup();
      api.get('/x', { skipErrorToast: true }).subscribe({ error: () => undefined });
      http.expectOne('https://api.test/x').flush({}, { status: 500, statusText: 'x' });
      expect(toast.all().length).toBe(0);
      void SKIP_ERROR_TOAST;
    });

    it('login refusé (401 sur SKIP_AUTH) → « Identifiants incorrects », pas de session expirée', () => {
      setup();
      session.login({ u: 'a', p: 'b' }).subscribe({ error: () => undefined });
      http.expectOne('https://api.test/auth/login').flush({}, { status: 401, statusText: 'x' });
      expect(toast.all()[0].message).toBe('Identifiants incorrects.');
      expect(session.status()).not.toBe('expired');
    });

    it('messages par statut surchargeables et callback onError', () => {
      const seen: ApiError[] = [];
      setup({ statusMessages: { 404: 'Rien ici.' }, onError: (e: ApiError) => seen.push(e) });
      api.get('/x').subscribe({ error: () => undefined });
      http.expectOne('https://api.test/x').flush({}, { status: 404, statusText: 'x' });
      expect(toast.all()[0].message).toBe('Rien ici.');
      expect(seen.length).toBe(1);
    });

    it('une requête annulée n’affiche aucun toast', () => {
      setup();
      api.get('/x', { cancelKey: 'k' }).subscribe();
      const r = http.expectOne('https://api.test/x');
      api.cancel('k');
      expect(r.cancelled).toBe(true);
      expect(toast.all().length).toBe(0);
    });
  });

  describe('loader', () => {
    it('s’active pendant la requête, sauf SKIP_LOADER / URL exclue', () => {
      setup();
      const loader = TestBed.inject(LoaderService);
      api.get('/a').subscribe();
      expect(loader.loading()).toBe(true);
      http.expectOne('https://api.test/a').flush({});
      expect(loader.loading()).toBe(false);

      api.get('/poll').subscribe();
      expect(loader.loading()).toBe(false);
      api.get('/b', { skipLoader: true }).subscribe();
      expect(loader.loading()).toBe(false);
      http.match(() => true).forEach((r) => r.flush({}));
      void SKIP_LOADER;
    });
  });
});
