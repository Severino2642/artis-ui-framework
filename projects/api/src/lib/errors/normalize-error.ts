import { HttpErrorResponse } from '@angular/common/http';
import type { ArtApiConfig } from '../api.config';
import { ApiError, ApiErrorKind, ProblemDetails } from './api-error';

/** Messages par défaut (FR). Surchargeables via `ArtApiConfig.statusMessages`. */
export const DEFAULT_STATUS_MESSAGES: Record<number | 'network' | 'timeout' | 'unknown' | 'loginFailed', string> = {
  400: 'La requête est invalide. Vérifiez les informations saisies.',
  401: 'Votre session a expiré. Veuillez vous reconnecter.',
  403: "Accès refusé. Vous n'avez pas les droits nécessaires.",
  404: 'La ressource demandée est introuvable.',
  409: 'Conflit : cette ressource existe déjà ou a été modifiée entre-temps.',
  422: 'Certaines données sont invalides. Corrigez-les puis réessayez.',
  429: 'Trop de requêtes. Patientez un instant avant de réessayer.',
  500: 'Une erreur est survenue côté serveur. Réessayez plus tard.',
  502: 'Le service est momentanément indisponible. Réessayez plus tard.',
  503: 'Le service est momentanément indisponible. Réessayez plus tard.',
  504: 'Le serveur met trop de temps à répondre. Réessayez plus tard.',
  network: 'Impossible de joindre le serveur. Vérifiez votre connexion.',
  timeout: 'La requête a expiré. Réessayez.',
  unknown: "Une erreur inattendue s'est produite.",
  loginFailed: 'Identifiants incorrects.',
};

function kindFor(status: number): ApiErrorKind {
  switch (status) {
    case 0: return 'network';
    case 400:
    case 422: return 'validation';
    case 401: return 'session-expired';
    case 403: return 'forbidden';
    case 404: return 'not-found';
    case 409: return 'conflict';
    case 408:
    case 504: return 'timeout';
    case 429: return 'rate-limited';
    case 502:
    case 503: return 'unavailable';
    default: return status >= 500 ? 'server' : 'unknown';
  }
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Lit un corps JSON, que Angular l'ait déjà parsé ou non. */
function readBody(err: HttpErrorResponse): unknown {
  const body = err.error;
  if (typeof body === 'string') {
    try { return JSON.parse(body); } catch { return undefined; }
  }
  if (typeof ProgressEvent !== 'undefined' && body instanceof ProgressEvent) return undefined;
  if (typeof Blob !== 'undefined' && body instanceof Blob) return undefined;
  return body ?? undefined;
}

function toFieldErrors(v: unknown): Record<string, string[]> | undefined {
  if (!isRecord(v)) return undefined;
  const out: Record<string, string[]> = {};
  for (const [k, val] of Object.entries(v)) {
    if (Array.isArray(val)) out[k] = val.map(String);
    else if (typeof val === 'string') out[k] = [val];
  }
  return Object.keys(out).length ? out : undefined;
}

function str(v: unknown): string | undefined {
  return typeof v === 'string' && v ? v : undefined;
}

/**
 * Convertit n'importe quelle erreur en `ApiError`.
 *
 * - Le message affiché à l'utilisateur vient de la table de messages par statut (jamais du corps serveur,
 *   qui peut contenir des détails techniques) ; `detail`/`title` du serveur restent disponibles sur l'erreur.
 * - Un code métier reconnu (`businessErrors`) prend le dessus sur le statut HTTP.
 * - Gère RFC 7807 (`application/problem+json`).
 */
export function normalizeHttpError(err: unknown, config: ArtApiConfig, ctx: { isAuthRequest?: boolean } = {}): ApiError {
  if (err instanceof ApiError) return err;
  const messages = { ...DEFAULT_STATUS_MESSAGES, ...config.statusMessages };

  if (!(err instanceof HttpErrorResponse)) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return new ApiError('cancelled', 0, '', { cause: err, silent: true });
    }
    return new ApiError('unknown', 0, messages.unknown, { cause: err });
  }

  const body = readBody(err);
  const problem = isRecord(body) ? (body as ProblemDetails) : undefined;
  const status = err.status;

  const traceId =
    str(err.headers?.get('X-Request-Id')) ?? str(problem?.traceId) ?? str(problem?.trace_id);

  const nested = isRecord(problem?.['error']) ? (problem?.['error'] as Record<string, unknown>) : undefined;
  const code =
    config.extractErrorCode?.(body, err.headers) ??
    str(problem?.code) ??
    str(nested?.['code']) ??
    str(problem?.['errorCode']) ??
    str(err.headers?.get('X-Error-Code'));

  const detail = str(problem?.detail);
  const title = str(problem?.title);
  const fieldErrors = toFieldErrors(problem?.errors) ?? toFieldErrors(problem?.['fieldErrors']);

  const biz = code ? config.businessErrors[code] : undefined;
  if (biz) {
    return new ApiError('business', status, biz.message.replace('{detail}', detail ?? ''), {
      title: biz.title ?? title,
      code, detail, fieldErrors, traceId, problem,
      action: biz.action,
      severity: biz.severity ?? 'error',
      silent: biz.silent,
      cause: err,
    });
  }

  const kind = kindFor(status);
  const message =
    status === 0
      ? messages.network
      : status === 401 && ctx.isAuthRequest
      ? messages.loginFailed
      : (messages as Record<number, string>)[status] ?? (status >= 500 ? messages[500] : messages.unknown);

  return new ApiError(kind, status, message, {
    title, code, detail, fieldErrors, traceId, problem,
    severity: kind === 'not-found' || kind === 'conflict' || kind === 'validation' ? 'warning' : 'error',
    cause: err,
  });
}
