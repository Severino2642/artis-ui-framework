import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { DEFAULT_API_CONFIG } from '../api.config';
import { ApiError, isApiError } from './api-error';
import { normalizeHttpError } from './normalize-error';

const cfg = { ...DEFAULT_API_CONFIG, businessErrors: { QUOTA_EXCEEDED: { message: 'Quota ({detail})' } } };
const http = (status: number, error?: unknown, headers?: Record<string, string>) =>
  new HttpErrorResponse({ status, error, headers: new HttpHeaders(headers) });

describe('normalizeHttpError', () => {
  it.each([[400, 'validation'], [401, 'session-expired'], [403, 'forbidden'], [404, 'not-found'], [409, 'conflict'], [422, 'validation'], [429, 'rate-limited'], [500, 'server'], [502, 'unavailable'], [503, 'unavailable'], [504, 'timeout'], [0, 'network'], [418, 'unknown']])(
    'statut %i → %s', (status, kind) => expect(normalizeHttpError(http(status), cfg).kind).toBe(kind));

  it('un 5xx inconnu retombe sur le message 500', () => {
    expect(normalizeHttpError(http(507), cfg).message).toContain('serveur');
  });

  it('lit un corps JSON sous forme de chaîne', () => {
    const e = normalizeHttpError(http(400, JSON.stringify({ code: 'QUOTA_EXCEEDED', detail: '10/10' })), cfg);
    expect(e.kind).toBe('business');
    expect(e.message).toBe('Quota (10/10)');
  });

  it('code métier dans body.error.code, errorCode ou X-Error-Code', () => {
    expect(normalizeHttpError(http(400, { error: { code: 'QUOTA_EXCEEDED' } }), cfg).code).toBe('QUOTA_EXCEEDED');
    expect(normalizeHttpError(http(400, { errorCode: 'QUOTA_EXCEEDED' }), cfg).code).toBe('QUOTA_EXCEEDED');
    expect(normalizeHttpError(http(400, {}, { 'X-Error-Code': 'QUOTA_EXCEEDED' }), cfg).kind).toBe('business');
  });

  it('extractErrorCode personnalisé', () => {
    const e = normalizeHttpError(http(400, { meta: { c: 'QUOTA_EXCEEDED' } }), { ...cfg, extractErrorCode: (b) => (b as { meta: { c: string } }).meta.c });
    expect(e.kind).toBe('business');
  });

  it('code inconnu → message du statut', () => {
    const e = normalizeHttpError(http(403, { code: 'INCONNU' }), cfg);
    expect(e.kind).toBe('forbidden');
    expect(e.code).toBe('INCONNU');
  });

  it('traceId depuis l’en-tête X-Request-Id', () => {
    expect(normalizeHttpError(http(500, null, { 'X-Request-Id': 'abc' }), cfg).traceId).toBe('abc');
  });

  it('erreurs non HTTP', () => {
    expect(normalizeHttpError(new Error('x'), cfg).kind).toBe('unknown');
    const abort = normalizeHttpError(new DOMException('a', 'AbortError'), cfg);
    expect(abort.kind).toBe('cancelled');
    expect(abort.silent).toBe(true);
  });

  it('idempotent sur une ApiError', () => {
    const e = new ApiError('server', 500, 'm');
    expect(normalizeHttpError(e, cfg)).toBe(e);
    expect(isApiError(e)).toBe(true);
    expect(isApiError(new Error())).toBe(false);
  });
});
