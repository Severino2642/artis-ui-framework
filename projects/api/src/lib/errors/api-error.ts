/** Catégorie fonctionnelle d'une erreur, utile pour décider de l'UX. */
export type ApiErrorKind =
  | 'validation'
  | 'session-expired'
  | 'forbidden'
  | 'not-found'
  | 'conflict'
  | 'rate-limited'
  | 'server'
  | 'unavailable'
  | 'network'
  | 'timeout'
  | 'business'
  | 'cancelled'
  | 'unknown';

/** Action proposée à l'utilisateur pour une erreur métier. */
export interface ErrorAction {
  label: string;
  /** Navigation Angular. */
  route?: string;
  /** URL externe ouverte dans un nouvel onglet. */
  href?: string;
  /** Callback libre. */
  handler?: () => void;
}

export interface BusinessErrorDef {
  /** Message affiché à l'utilisateur. `{detail}` est remplacé par le détail serveur. */
  message: string;
  title?: string;
  severity?: 'error' | 'warning' | 'info';
  action?: ErrorAction;
  /** Si vrai, aucun toast n'est affiché (l'erreur est quand même propagée). */
  silent?: boolean;
}

/** Ex. `{ BILLING_RESTRICTED: { message: '…', action: { label: 'Voir ma facturation', route: '/billing' } } }`. */
export type BusinessErrorMap = Record<string, BusinessErrorDef>;

/** Corps d'erreur RFC 7807 (`application/problem+json`). */
export interface ProblemDetails {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  /** Extensions fréquentes. */
  code?: string;
  errors?: Record<string, string[] | string>;
  traceId?: string;
  trace_id?: string;
  [key: string]: unknown;
}

export interface ApiErrorOptions {
  title?: string;
  code?: string;
  detail?: string;
  /** Erreurs par champ : `{ email: ['Déjà utilisé'] }`. */
  fieldErrors?: Record<string, string[]>;
  traceId?: string;
  problem?: ProblemDetails;
  action?: ErrorAction;
  severity?: 'error' | 'warning' | 'info';
  silent?: boolean;
  cause?: unknown;
}

/** Erreur normalisée émise par @artis/api. L'erreur HTTP d'origine est conservée dans `cause`. */
export class ApiError extends Error {
  override readonly name = 'ApiError';
  readonly title?: string;
  readonly code?: string;
  readonly detail?: string;
  readonly fieldErrors?: Record<string, string[]>;
  readonly traceId?: string;
  readonly problem?: ProblemDetails;
  readonly action?: ErrorAction;
  readonly severity: 'error' | 'warning' | 'info';
  readonly silent: boolean;

  constructor(
    public readonly kind: ApiErrorKind,
    public readonly status: number,
    message: string,
    options: ApiErrorOptions = {},
  ) {
    super(message, { cause: options.cause });
    this.title = options.title;
    this.code = options.code;
    this.detail = options.detail;
    this.fieldErrors = options.fieldErrors;
    this.traceId = options.traceId;
    this.problem = options.problem;
    this.action = options.action;
    this.severity = options.severity ?? 'error';
    this.silent = options.silent ?? false;
  }
}

export function isApiError(e: unknown): e is ApiError {
  return e instanceof ApiError;
}
