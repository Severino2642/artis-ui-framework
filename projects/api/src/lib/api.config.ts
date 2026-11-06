import { HttpContextToken } from '@angular/common/http';
import { InjectionToken } from '@angular/core';
import type { ApiError, BusinessErrorMap } from './errors/api-error';
import type { ListContract } from './api.models';

export type TokenStorageKind = 'localStorage' | 'sessionStorage' | 'memory';

/** Réponse d'authentification normalisée. */
export interface TokenPair {
  accessToken: string;
  refreshToken?: string;
  /** Timestamp d'expiration en ms (epoch). Déduit du JWT (`exp`) ou de `expires_in` si absent. */
  expiresAt?: number;
}

export interface ArtApiConfig {
  /** URL de base du backend, SANS slash final. Ex. `https://api.exemple.com`. Défaut : `''` (même origine). */
  baseUrl: string;

  /** Où stocker les jetons. `memory` est le plus sûr (perdu au rechargement). Défaut : `sessionStorage`. */
  storage: TokenStorageKind;
  /** Préfixe des clés de stockage. Défaut : `art`. */
  storagePrefix: string;

  /** Endpoints d'authentification (relatifs à baseUrl). */
  authEndpoints: { login: string; logout?: string; refresh: string };
  /** Route Angular vers laquelle rediriger si la session est invalide. Défaut : `/login`. */
  loginRoute: string;
  /** Route par défaut après connexion. Défaut : `/`. */
  homeRoute: string;
  /** Nom de l'en-tête d'auth et préfixe du jeton. Défaut : `Authorization` / `Bearer`. */
  tokenHeader: string;
  tokenPrefix: string;
  /** Secondes avant l'expiration à partir desquelles on rafraîchit de façon proactive. Défaut : 30. */
  refreshSkewSeconds: number;
  /** Convertit la réponse brute du login/refresh en `TokenPair`. Défaut : gère les formats courants. */
  mapAuthResponse?: (body: unknown) => TokenPair;

  /** En-tête de traçage ajouté à chaque requête. `false` pour désactiver. Défaut : `X-Request-Id`. */
  requestIdHeader: string | false;

  /** Protection CSRF « double submit cookie ». `false` pour désactiver. */
  csrf: { cookieName: string; headerName: string } | false;
  /** Envoyer les cookies (withCredentials) sur les appels vers baseUrl. Défaut : false. */
  withCredentials: boolean;

  /** Messages par code HTTP (fusionnés avec les défauts). */
  statusMessages: Partial<Record<number | 'network' | 'timeout' | 'unknown' | 'loginFailed', string>>;
  /** Codes d'erreur métier → message & action. */
  businessErrors: BusinessErrorMap;
  /** Extrait le code métier depuis le corps de l'erreur. Défaut : `body.code` | `body.error.code` | `body.errorCode`. */
  extractErrorCode?: (body: unknown, headers: { get(name: string): string | null }) => string | undefined;
  /** Affiche automatiquement un toast pour chaque erreur. Défaut : true. */
  toastOnError: boolean;
  /** Appelé pour chaque erreur normalisée (journalisation, monitoring). Ne jamais y logguer de secrets. */
  onError?: (error: ApiError) => void;

  /** URLs (sous-chaînes) pour lesquelles le loader global n'est pas affiché. */
  loaderExcludedUrls: string[];
  /** Contrat de pagination / tri / filtres. */
  listContract: ListContract;
}

export const DEFAULT_API_CONFIG: ArtApiConfig = {
  baseUrl: '',
  storage: 'sessionStorage',
  storagePrefix: 'art',
  authEndpoints: { login: '/auth/login', logout: '/auth/logout', refresh: '/auth/refresh' },
  loginRoute: '/login',
  homeRoute: '/',
  tokenHeader: 'Authorization',
  tokenPrefix: 'Bearer',
  refreshSkewSeconds: 30,
  requestIdHeader: 'X-Request-Id',
  csrf: false,
  withCredentials: false,
  statusMessages: {},
  businessErrors: {},
  toastOnError: true,
  loaderExcludedUrls: [],
  listContract: {
    pageParam: 'page',
    pageSizeParam: 'pageSize',
    sortParam: 'sort',
    searchParam: 'q',
    filterParam: (key) => `filter[${key}]`,
    firstPage: 1,
  },
};

export const ART_API_CONFIG = new InjectionToken<ArtApiConfig>('ART_API_CONFIG', {
  providedIn: 'root',
  factory: () => DEFAULT_API_CONFIG,
});

/* ── Contextes par requête ─────────────────────────────────────────────
   Usage : http.get(url, { context: new HttpContext().set(SKIP_LOADER, true) }) */

/** Ne pas afficher le loader global pour cette requête. */
export const SKIP_LOADER = new HttpContextToken<boolean>(() => false);
/** Ne pas joindre le jeton d'authentification (ex. appel public). */
export const SKIP_AUTH = new HttpContextToken<boolean>(() => false);
/** Ne pas afficher de toast d'erreur pour cette requête (l'erreur est quand même propagée). */
export const SKIP_ERROR_TOAST = new HttpContextToken<boolean>(() => false);
