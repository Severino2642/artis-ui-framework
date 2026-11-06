import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable, firstValueFrom, isObservable, of } from 'rxjs';
import { SessionService } from '../session/session.service';
import { apiTestProviders, fakeJwt } from '../test-utils';
import { authGuard, guestGuard, roleGuard } from './auth.guard';

const run = async (guard: unknown, url = '/secret') => {
  const r = TestBed.runInInjectionContext(() => (guard as (a: ActivatedRouteSnapshot, b: RouterStateSnapshot) => unknown)({} as ActivatedRouteSnapshot, { url } as RouterStateSnapshot));
  return isObservable(r) ? firstValueFrom(r as Observable<unknown>) : r;
};

describe('guards', () => {
  let session: SessionService;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: apiTestProviders() });
    session = TestBed.inject(SessionService);
  });

  it('authGuard : anonyme → redirection login avec returnUrl', async () => {
    const r = (await run(authGuard, '/factures?x=1')) as UrlTree;
    expect(r.toString()).toBe('/login?returnUrl=%2Ffactures%3Fx%3D1');
  });

  it('authGuard : jeton valide → true', async () => {
    session.setTokens({ accessToken: fakeJwt(3600) });
    expect(await run(authGuard)).toBe(true);
  });

  it('authGuard : jeton expiré sans refresh possible → login + session invalidée', async () => {
    session.setTokens({ accessToken: fakeJwt(-10), expiresAt: Date.now() - 1000 });
    const r = (await run(authGuard)) as UrlTree;
    expect(r.toString()).toContain('/login');
    expect(session.status()).toBe('expired');
  });

  it('guestGuard : connecté → accueil ; anonyme → true', async () => {
    expect(await run(guestGuard)).toBe(true);
    session.setTokens({ accessToken: fakeJwt(3600) });
    expect(((await run(guestGuard)) as UrlTree).toString()).toBe('/');
  });

  it('roleGuard : autorise selon la claim roles', async () => {
    session.setTokens({ accessToken: fakeJwt(3600, { roles: ['admin'] }) });
    expect(await run(roleGuard(['admin']))).toBe(true);
    expect(((await run(roleGuard(['root']))) as UrlTree).toString()).toBe('/forbidden');
    void of;
  });
});
