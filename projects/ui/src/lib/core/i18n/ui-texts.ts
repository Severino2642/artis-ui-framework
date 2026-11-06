import { EnvironmentProviders, InjectionToken, makeEnvironmentProviders } from '@angular/core';

/** Tous les textes affichés par les composants (hors contenu fourni par le projet). Surchargeables par `provideArtUiTexts`. */
export interface ArtUiTexts {
  select: { choose: string; add: string };
  boolean: { yes: string; no: string };
  interval: { min: string; max: string };
  validating: string;
  search: string;
  info: { show: string };
  secret: { show: string; hide: string; copy: string; copied: string; copyFailed: string; empty: string };
  color: {
    open: string; hex: string; rgb: string; hsl: string; palette: string; preview: string; apply: string; close: string;
    hue: string; saturation: string; alpha: string; invalid: string; none: string;
  };
  file: {
    dropHere: string; browse: string; remove: string; uploading: string; uploaded: string; retry: string;
    tooMany: (max: number) => string; tooLarge: (name: string, max: string) => string; badType: (name: string, accept: string) => string;
    uploadFailed: (name: string) => string; noEndpoint: string; selected: (n: number) => string; progress: (n: number) => string;
  };
  modal: { close: string };
  form: { invalid: string };
  list: { filterColumn: (col: string) => string; sortBy: (col: string) => string; apply: string; clear: string; clickToFilter: string; noData: string };
}

export const DEFAULT_UI_TEXTS: ArtUiTexts = {
  select: { choose: '-- Choisir --', add: '-- Ajouter --' },
  boolean: { yes: 'Vrai', no: 'Faux' },
  interval: { min: 'Min', max: 'Max' },
  validating: 'Validation…',
  search: 'Rechercher',
  info: { show: "Afficher l'explication" },
  secret: {
    show: 'Afficher la valeur', hide: 'Masquer la valeur', copy: 'Copier la valeur', copied: 'Valeur copiée',
    copyFailed: 'Impossible de copier la valeur', empty: 'Aucune valeur',
  },
  color: {
    open: 'Ouvrir le sélecteur de couleur', hex: 'Hexadécimal', rgb: 'RVB', hsl: 'TSL', palette: 'Palette', preview: 'Aperçu',
    apply: 'Appliquer', close: 'Fermer', hue: 'Teinte', saturation: 'Saturation et luminosité', alpha: 'Opacité',
    invalid: 'Couleur invalide (ex. #EA580C)', none: 'Aucune couleur',
  },
  file: {
    dropHere: 'Glissez-déposez vos fichiers ici', browse: 'Parcourir', remove: 'Supprimer le fichier', uploading: 'Envoi en cours…',
    uploaded: 'Envoyé', retry: 'Réessayer',
    tooMany: (max) => `Nombre maximal de fichiers dépassé (${max}).`,
    tooLarge: (name, max) => `« ${name} » dépasse la taille maximale autorisée (${max}).`,
    badType: (name, accept) => `« ${name} » n'est pas d'un type autorisé (${accept}).`,
    uploadFailed: (name) => `Échec de l'envoi de « ${name} ».`,
    noEndpoint: "Aucun endpoint d'envoi configuré pour ce champ.",
    selected: (n) => (n > 1 ? `${n} fichiers sélectionnés` : `${n} fichier sélectionné`),
    progress: (n) => `Envoi : ${n} %`,
  },
  modal: { close: 'Fermer' },
  form: { invalid: 'Certains champs sont invalides. Veuillez corriger les erreurs avant de sauvegarder.' },
  list: {
    filterColumn: (col) => `Filtrer la colonne ${col}`,
    sortBy: (col) => `Trier par ${col}`,
    apply: 'Appliquer',
    clear: 'Effacer',
    clickToFilter: 'Cliquer pour filtrer sur cette valeur',
    noData: 'Aucune donnée à afficher.',
  },
};

export const ART_UI_TEXTS = new InjectionToken<ArtUiTexts>('ART_UI_TEXTS', {
  providedIn: 'root',
  factory: () => DEFAULT_UI_TEXTS,
});

type DeepPartial<T> = { [K in keyof T]?: T[K] extends (...a: never[]) => unknown ? T[K] : DeepPartial<T[K]> };

function merge<T>(base: T, over?: DeepPartial<T>): T {
  if (!over) return base;
  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const [k, v] of Object.entries(over)) {
    const b = (base as Record<string, unknown>)[k];
    out[k] = v && typeof v === 'object' && b && typeof b === 'object' ? merge(b, v as never) : v;
  }
  return out as T;
}

/** Surcharge (partielle) des textes : `provideArtUiTexts({ select: { choose: '-- Select --' } })`. */
export function provideArtUiTexts(texts: DeepPartial<ArtUiTexts>): EnvironmentProviders {
  return makeEnvironmentProviders([{ provide: ART_UI_TEXTS, useValue: merge(DEFAULT_UI_TEXTS, texts) }]);
}
