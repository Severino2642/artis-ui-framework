export type ToastType = 'success' | 'error' | 'warning' | 'info';

export type ToastPosition =
  | 'top-right'
  | 'top-center'
  | 'top-left'
  | 'bottom-right'
  | 'bottom-center'
  | 'bottom-left';

/** Action optionnelle affichée dans un toast (ex. « Annuler », « Réessayer »). */
export interface ToastAction {
  label: string;
  /** Appelée au clic ; le toast se ferme ensuite sauf si `keepOpen` est vrai. */
  handler: () => void;
  keepOpen?: boolean;
}

/** Options d'un toast. Tout est optionnel sauf `message`. */
export interface ToastOptions {
  message: string;
  title?: string;
  /** Durée en ms ; 0 = reste affiché jusqu'à fermeture. Défaut selon le type (voir ToasterConfig). */
  duration?: number;
  action?: ToastAction;
  /** Affiche le bouton de fermeture. Défaut : true. */
  dismissible?: boolean;
  /** Identifiant : un toast avec le même `id` remplace/dédoublonne l'existant. */
  id?: string;
  /** Nom d'icône Material Symbols ; par défaut une icône par type. */
  icon?: string;
}

export interface Toast extends Required<Pick<ToastOptions, 'message' | 'dismissible'>> {
  id: string;
  type: ToastType;
  title?: string;
  duration: number;
  action?: ToastAction;
  icon: string;
  /** Vrai pendant l'animation de sortie. */
  leaving: boolean;
  createdAt: number;
}

export interface ToasterConfig {
  /** Position du conteneur. Défaut : `top-right`. */
  position: ToastPosition;
  /** Nombre maximal de toasts visibles ; les suivants attendent en file. Défaut : 4. */
  maxVisible: number;
  /** Durées par défaut (ms). */
  durations: Record<ToastType, number>;
  /** Durée de l'animation de sortie (ms). Défaut : 200. */
  leaveAnimationMs: number;
  /** Titres par défaut par type (surchargeables pour l'i18n). */
  titles: Record<ToastType, string>;
  /** Libellé accessible du bouton de fermeture. */
  closeLabel: string;
}

export const DEFAULT_TOASTER_CONFIG: ToasterConfig = {
  position: 'top-right',
  maxVisible: 4,
  durations: { success: 4000, info: 5000, warning: 7000, error: 0 },
  leaveAnimationMs: 200,
  titles: { success: 'Succès', error: 'Erreur', warning: 'Attention', info: 'Information' },
  closeLabel: 'Fermer la notification',
};

export const TOAST_ICONS: Record<ToastType, string> = {
  success: 'check_circle',
  error: 'error',
  warning: 'warning',
  info: 'info',
};
