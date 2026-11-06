import { HttpErrorResponse, HttpEvent, HttpEventType, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { Observable, concat, delay, of, throwError, timer, map, take } from 'rxjs';

/** Faux backend de démonstration : aucune requête réseau réelle. */
function jwt(ttlSeconds: number): string {
  const b64 = (o: unknown) => btoa(JSON.stringify(o)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `${b64({ alg: 'none' })}.${b64({ sub: 'demo', name: 'Demo User', roles: ['admin'], exp: Math.floor(Date.now() / 1000) + ttlSeconds })}.sig`;
}

const CLIENTS = [
  { id: 1, name: 'Acme Industries', email: 'contact@acme.test' },
  { id: 2, name: 'Globex SA', email: 'hello@globex.test' },
  { id: 3, name: 'Initech', email: 'info@initech.test' },
];
let nextClientId = 4;

export const mockBackendInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith('/api')) return next(req);
  const path = req.url.replace('/api', '');
  const ok = <T>(body: T, ms = 250) => of(new HttpResponse({ status: 200, body })).pipe(delay(ms));
  const fail = (status: number, body?: unknown) =>
    throwError(() => new HttpErrorResponse({ status, url: req.url, error: body, headers: undefined })).pipe(delay(250));

  if (path === '/auth/login' && req.method === 'POST') {
    const b = req.body as { username?: string; password?: string };
    return b?.password === 'demo'
      ? ok({ accessToken: jwt(3600), refreshToken: 'refresh-demo' })
      : fail(401, { title: 'Bad credentials' });
  }
  if (path === '/auth/refresh') return ok({ accessToken: jwt(3600), refreshToken: 'refresh-demo' });
  if (path === '/auth/logout') return ok({});

  if (path.startsWith('/fail/')) {
    const code = path.split('/')[2];
    if (code === 'business-billing')
      return fail(402, { type: 'about:blank', title: 'Billing restricted', status: 402, code: 'BILLING_RESTRICTED', detail: 'Plan expired on 2026-10-01' });
    if (code === 'business-quota')
      return fail(429, { code: 'QUOTA_EXCEEDED', detail: '1000/1000 requests' });
    if (code === '422')
      return fail(422, { type: 'https://example.test/validation', title: 'Validation failed', status: 422, errors: { email: ['Adresse e-mail invalide'], name: ['Nom requis'] } });
    if (code === '0') return throwError(() => new HttpErrorResponse({ status: 0, url: req.url, error: new ProgressEvent('error') })).pipe(delay(250));
    return fail(Number(code), { title: `HTTP ${code}` });
  }

  if (path === '/upload' && req.method === 'POST') {
    const file = (req.body as FormData).get('file') as File;
    if (file?.name.toLowerCase().includes('fail')) return fail(500, { title: 'Upload failed' });
    const steps = 5;
    const progress$ = timer(0, 180).pipe(
      take(steps),
      map((i): HttpEvent<unknown> => ({ type: HttpEventType.UploadProgress, loaded: (i + 1) * 20, total: 100 })),
    );
    const done$ = of(new HttpResponse({ status: 200, body: { id: Math.floor(Math.random() * 1e6), url: `https://files.example.test/${encodeURIComponent(file?.name ?? 'file')}` } })).pipe(delay(60));
    return concat(progress$, done$) as Observable<HttpEvent<unknown>>;
  }

  if (path.startsWith('/clients') && req.method === 'GET') {
    const q = (req.params.get('q') ?? '').toLowerCase();
    return ok(CLIENTS.filter((c) => c.name.toLowerCase().includes(q)));
  }
  if (path === '/clients' && req.method === 'POST') {
    const b = req.body as { name: string; email: string };
    const client = { id: nextClientId++, name: b.name, email: b.email };
    CLIENTS.push(client);
    return ok(client, 500);
  }
  return fail(404, { title: 'Not found' });
};
