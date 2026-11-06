import { EnvironmentProviders, Provider } from '@angular/core';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideToaster } from '@artis/toaster';
import { provideArtApi } from './provide-api';
import { ArtApiConfig } from './api.config';

/** Fabrique un JWT factice (non signé) expirant dans `ttlSeconds`. */
export function fakeJwt(ttlSeconds: number, claims: Record<string, unknown> = {}): string {
  const b64 = (o: unknown) => btoa(JSON.stringify(o)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `${b64({ alg: 'none' })}.${b64({ sub: 'u1', exp: Math.floor(Date.now() / 1000) + ttlSeconds, ...claims })}.sig`;
}

export function apiTestProviders(config: Partial<ArtApiConfig> = {}): (Provider | EnvironmentProviders)[] {
  return [
    provideRouter([{ path: 'login', children: [] }, { path: '**', children: [] }]),
    provideToaster(),
    provideArtApi({ baseUrl: 'https://api.test', storage: 'memory', ...config }),
    provideHttpClientTesting(),
  ];
}
