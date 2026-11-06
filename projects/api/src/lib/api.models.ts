export type SortDirection = 'asc' | 'desc';

export interface SortSpec {
  field: string;
  direction: SortDirection;
}

/** Requête de liste standardisée (pagination + tri + filtres + recherche). */
export interface ListQuery {
  /** Numéro de page, base `listContract.firstPage` (1 par défaut). */
  page?: number;
  pageSize?: number;
  sort?: SortSpec[];
  /** Filtres clé → valeur (tableaux = valeurs multiples). Les valeurs vides sont ignorées. */
  filters?: Record<string, unknown>;
  /** Recherche plein texte. */
  search?: string;
}

/** Page de résultats standardisée. */
export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

/** Contrat de nommage des paramètres de liste (adaptable au backend du projet). */
export interface ListContract {
  pageParam: string;
  pageSizeParam: string;
  /** Format produit : `champ:asc,autre:desc`. */
  sortParam: string;
  searchParam: string;
  /** Nom du paramètre pour un filtre : défaut `filter[clé]`. */
  filterParam: (key: string) => string;
  firstPage: number;
  /** Convertit la réponse brute du backend en `Page<T>`. Défaut : accepte `{items,total}` / `{data,total}` / tableau. */
  mapPage?: <T>(body: unknown, query: ListQuery) => Page<T>;
}

export type UploadEvent<T = unknown> =
  | { type: 'progress'; loaded: number; total: number | undefined; percent: number }
  | { type: 'done'; body: T };

export interface RequestOptions {
  params?: Record<string, unknown>;
  headers?: Record<string, string>;
  /** Signal d'annulation (`AbortController.signal`). */
  signal?: AbortSignal;
  /** Clé d'annulation groupée : un nouvel appel avec la même clé annule le précédent (utile recherche/autocomplétion). */
  cancelKey?: string;
  /** Ne pas afficher le loader global. */
  skipLoader?: boolean;
  /** Ne pas afficher le toast d'erreur. */
  skipErrorToast?: boolean;
  /** Ne pas joindre le jeton d'authentification. */
  skipAuth?: boolean;
}
