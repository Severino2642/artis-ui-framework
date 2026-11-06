import { InjectionToken, Type } from '@angular/core';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'fullscreen';

/** Configuration d'ouverture d'une modale. */
export interface ModalConfig<C = unknown> {
  /** Composant Angular (standalone) à afficher dans la modale. */
  component: Type<C>;
  /** Valeurs passées aux `@Input()` / `input()` du composant (via `setInput`). Disponibles aussi via `ART_MODAL_DATA`. */
  inputs?: Record<string, unknown>;
  /** Titre affiché dans l'en-tête (et utilisé comme nom accessible du dialogue). */
  title?: string;
  /** Nom accessible si aucun `title` n'est fourni. */
  ariaLabel?: string;
  /** Défaut : `md`. */
  size?: ModalSize;
  /** Fermeture au clic sur le fond. Défaut : true. */
  closeOnBackdrop?: boolean;
  /** Fermeture par Échap. Défaut : true. */
  closeOnEscape?: boolean;
  /** Affiche le bouton ✕. Défaut : true. */
  showCloseButton?: boolean;
  /** Si vrai, la promesse est REJETÉE (`ModalDismissedError`) quand la modale est fermée sans résultat. Défaut : false (résout `undefined`). */
  rejectOnDismiss?: boolean;
}

/** Erreur de rejet quand `rejectOnDismiss` est actif. */
export class ModalDismissedError extends Error {
  override readonly name = 'ModalDismissedError';
  constructor() { super('Modal dismissed without result'); }
}

/** Données d'entrée de la modale, injectables dans le composant enfant. */
export const ART_MODAL_DATA = new InjectionToken<Record<string, unknown>>('ART_MODAL_DATA');
