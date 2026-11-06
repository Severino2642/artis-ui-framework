/* ================================================================
   VALIDATORS — Structure
================================================================ */

/** Types de validateurs supportés */
export type ValidatorType =
  | 'required'
  | 'minLength'
  | 'maxLength'
  | 'min'
  | 'max'
  | 'pattern'
  | 'email'
  | 'url'
  | 'custom';

/** Un validateur individuel */
export interface FieldValidator {
  type: ValidatorType;

  /** Message d'erreur personnalisé (sinon message par défaut) */
  message?: string;

  /** Pour minLength / maxLength */
  length?: number;

  /** Pour min / max (nombre ou date) */
  value?: number | Date | string;

  /** Pour pattern : regex sous forme de string */
  pattern?: string;
  flags?: string;   // ex: 'i'

  /**
   * Validation synchrone custom.
   * Retourne null si OK, sinon le message d'erreur.
   * Reçoit aussi tous les autres champs du formulaire.
   */
  fn?: (value: any, allFormValues?: Record<string, any>) => string | null;

  /**
   * Validation asynchrone (ex: unicité via API).
   * Retourne Promise<null> si OK, sinon le message d'erreur.
   */
  asyncFn?: (value: any, allFormValues?: Record<string, any>) => Promise<string | null>;
}

/** Configuration de validation pour un champ */
export interface FieldValidation {
  validators: FieldValidator[];
  /** Arrêter à la première erreur (default: false) */
  stopOnFirstError?: boolean;
}

export interface ValidationResult {
  valid:     boolean;
  errorKey?: string;   // ex: 'required', 'email', 'custom'
  message?:  string;
}
/* ================================================================
   FORM BUILDER — Models & Interfaces
================================================================ */

/** All supported field types */
export type FieldType =
  | 'text' | 'number' | 'date' | 'time' | 'datetime' | 'color'
  | 'select' | 'multiselect' | 'autocomplete' | 'interval' | 'textarea'
  | 'file' | 'secret'
  /** Type personnalisé enregistré via `provideArtFieldType('mon-type', MonComposant)`. */
  | (string & {});

/** Base type used inside an interval field */
export type IntervalBaseType = 'number' | 'date' | 'time' | 'datetime';

/** A button attached to a specific field */
export interface FieldButtonConfig {
  id: string;
  icon: string;              // Material Outlined icon name
  label?: string;
  tooltip?: string;
  variant?: 'default' | 'primary' | 'danger' | 'success';
}

/** Valeur d'un champ `file` (après sélection ou envoi). */
export interface ArtFileValue {
  name: string;
  size: number;
  type: string;
  /** URL du fichier une fois envoyé (selon la réponse du serveur). */
  url?: string;
  /** Identifiant serveur du fichier. */
  id?: string | number;
  /** Fichier natif, présent tant que le fichier n'a pas été envoyé par le champ (aucun endpoint configuré). */
  file?: File;
}

/** Les labels/titres de l'UI peuvent porter une explication contextuelle (Markdown restreint). */
export interface Explainable {
  /** Texte d'explication affiché dans une bulle à côté du libellé. Accepte **gras**, *italique*, [liens](https://…). */
  explanation?: string;
  /** Ouverture de la bulle : au clic (défaut) ou au survol/focus. */
  explanationTrigger?: 'click' | 'hover';
}

/** Configuration for a single form field */
export interface FormFieldConfig extends Explainable {
  name: string;               // attribute key — used as formValues key
  label?: string;             // display label (defaults to `name`)
  type?: FieldType;           // auto-detected from defaultValue if omitted
  visible?: boolean;          // default: true
  required?: boolean;
  defaultValue?: any;

  /**
   * Raw HTML attribute string applied directly to the input element.
   * Example: "min='0' max='100' step='5' readonly"
   */
  customProperties?: string;

  /** Bootstrap column width (1–12). Default: 4 (= col-md-4) */
  colSpan?: number;

  // ── select / multiselect ──────────────────────────────────────
  options?: any[];
  optionValueKey?: string;    // default: 'value'
  optionLabelKey?: string;    // default: 'label'

  // ── autocomplete ──────────────────────────────────────────────
  /** Array of objects OR an API URL string */
  autocompleteData?: any[] | string;
  /** Semicolon-separated keys to display in suggestions. e.g. "nom;age;ville" */
  autocompleteDisplayKeys?: string;
  /** Query parameter name when autocompleteData is a URL. Default: 'q' */
  autocompleteSearchParam?: string;

  // ── interval ──────────────────────────────────────────────────
  /** Base type for the interval field. Default: 'number' */
  intervalBaseType?: IntervalBaseType;
  /** Stored under `name` as { min, max } */

  // ── filtrage local (liste) ────────────────────────────────────
  /** Chemin (pointé) de la valeur à comparer dans chaque ligne si différent de `name`. */
  filterAttribute?: string;
  /** Mode de comparaison d'un filtre texte : `contains` (défaut), `startsWith`, `equals`. */
  filterMatch?: 'contains' | 'startsWith' | 'equals';

  // ── color ─────────────────────────────────────────────────────
  /** Palette prédéfinie (couleurs de marque) proposée dans le sélecteur. Surcharge `ART_COLOR_PALETTE`. */
  colorPalette?: string[];

  // ── secret ────────────────────────────────────────────────────
  /** `fixed` : toujours `secretMaskLength` points ; `length` : un point par caractère. Défaut : `fixed`. */
  secretMaskMode?: 'fixed' | 'length';
  /** Nombre de points en mode `fixed`. Défaut : 10. */
  secretMaskLength?: number;
  /** Bouton « copier ». Défaut : true. */
  secretCopyable?: boolean;
  /** Bouton « œil » pour révéler temporairement. Défaut : false. */
  secretRevealable?: boolean;
  /** Durée (ms) avant de re-masquer automatiquement ; 0 = jamais. Défaut : 10000. */
  secretRevealTimeout?: number;
  /** Retour après copie : icône ✓, toast, ou les deux. Défaut : `icon`. */
  secretCopyFeedback?: 'icon' | 'toast' | 'both';

  // ── file ──────────────────────────────────────────────────────
  /** Autorise plusieurs fichiers. Défaut : false. */
  fileMultiple?: boolean;
  /** Taille maximale par fichier, en octets. */
  fileMaxSize?: number;
  /** Types autorisés : MIME (`image/png`, `image/*`) ou extensions (`.pdf`). */
  fileAccept?: string[];
  /** Nombre maximal de fichiers (mode multiple). */
  fileMaxFiles?: number;
  /** Endpoint d'envoi (POST multipart). Sans endpoint, le champ ne téléverse pas : la valeur contient le `File`. */
  fileUploadUrl?: string;
  /** Nom du champ multipart. Défaut : `file`. */
  fileFieldName?: string;
  /** Champs multipart additionnels. */
  fileUploadFields?: Record<string, string>;
  /** Convertit la réponse du serveur en `{ id?, url?, name? }`. Défaut : lit `id`, `url`, `name` à la racine ou sous `data`. */
  fileMapResponse?: (body: unknown) => { id?: string | number; url?: string; name?: string };

  // ── buttons ───────────────────────────────────────────────────
  buttons?: FieldButtonConfig[];
  // Validation du champ
  validation?: FieldValidation;
  isReadOnly?: boolean;  // default: false
}

/** A collapsible section in the parent form */
export interface FormSectionConfig extends Explainable {
  title: string;
  subtitle?: string;
  icon?: string;              // Material Outlined icon name
  fields: FormFieldConfig[];
  collapsed?: boolean;        // default: false
}

/** An action button in the footer (reset / save / custom) */
export interface ActionButtonConfig {
  id: string;
  label: string;
  icon?: string;
  variant?: 'default' | 'primary' | 'danger' | 'success';
  cssClass?: string;
}

/** Full configuration for the parent form */
export interface FormConfig {
  sections: FormSectionConfig[];
  extraButtons?: ActionButtonConfig[];
}

/** Configuration des boutons d'action passés en footer de form-child
 *  quand le formulaire mère est absent */
export interface FormFooterConfig {
  extraButtons?: ActionButtonConfig[];
  showReset?: boolean;   // default: true
  showSave?:  boolean;   // default: true
  isMobile?:  boolean;
}

/** Configuration for the child (detail) form */
export interface ChildFormConfig extends Explainable {
  title: string;
  subtitle?: string;
  icon?: string;
  fields: FormFieldConfig[];
  defaultViewMode?: 'table' | 'card';  // default: 'table'
  extraButtons?: ActionButtonConfig[];
  /** Nombre de lignes ajoutées par le bouton « Ajouter N lignes » (en-tête ET pied). Défaut : 10. `0` masque ce bouton. */
  bulkAddCount?: number;
  /** Nombre maximal de lignes ; les boutons d'ajout se désactivent à la limite et l'ajout groupé est tronqué. */
  maxRows?: number;
}

// ── Events ────────────────────────────────────────────────────

/** Emitted when a field-level button is clicked */
export interface FieldButtonEvent {
  buttonId: string;
  fieldName: string;
  currentFieldValue: any;
  allFormValues: Record<string, any>;
}

/** Emitted when a form-level action button is clicked */
export interface FormActionEvent {
  buttonId: 'reset' | 'save' | string;
  parentValues: Record<string, any>;
  childValues: Record<string, any>[];
}
