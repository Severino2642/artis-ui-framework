import { Explainable } from '../../form/models/form-builder.model';
/* ================================================================
   DETAIL-VIEW — Models & Interfaces
================================================================ */

import {DurationConfig} from '../../core/models/format-number.model';

export type DetailFieldType =
  | 'text' | 'link' | 'image' | 'number' | 'date' | 'badge' | 'multibadge';

/** Badge display style */
export type BadgeStyle = 'filled' | 'outline';

/** Position in footer */
export type ButtonPosition = 'left' | 'right';

/** Button variant */
export type ButtonVariant = 'primary' | 'default' | 'danger' | 'success' | 'warning';

/** ── Field ── */
export interface DetailField extends Explainable {
  attribute: string;          // dot-notation: 'boutique.centre_commercial.nom'
  type?: DetailFieldType;     // default: 'text'
  label?: string;             // optional inline label override
  style?: string;
  cssClass?: string;
  unit?: string;

  // Number
  precision?: number;

  // Date
  dateFormat?: string;        // default: 'dd/MM/yyyy'

  // Badge & Multibadge
  badgeStyle?: BadgeStyle;    // default: 'filled'
  badgeColorMap?: Record<string, string>; // value → hex color
  badgeDefaultColor?: string;

  // Multibadge: attribute points to an array; displayKey is the field shown inside each badge
  displayKey?: string;        // e.g. 'nom' for categorie[].nom

  // Link
  linkHref?: string;          // static URL or '@attribute' for dynamic value
  linkTarget?: string;        // default: '_blank'
  isRedirectLink?: boolean;     // if true, uses routerLink for internal navigation instead of href
  formatDuration?: DurationConfig; // if type is 'number' and this config is provided, formats the number as a duration string
}

/** ── Section-column (vertical stack of fields inside a column) ── */
export interface SectionColumn {
  fields: DetailField[];
  colMd?: number;             // Bootstrap col-md-X (default: 6)
}

/** ── Card Column (a named column with its own section-columns) ── */
export interface CardColumn extends Explainable {
  title?: string;
  sectionColumns: SectionColumn[];
}

/** ── Card Section (one row in the body grid) ── */
export interface CardSection {
  columns: CardColumn[];
  gridCols?: any;          // CSS grid-template-columns count (default: auto from columns.length)
}

/** ── Footer Button ── */
export interface DetailButton {
  id: string;
  label: string;
  icon?: string;
  style?: string;
  cssClass?: string;
  position?: ButtonPosition;  // default: 'right'
  variant?: ButtonVariant;
}

/** ── Card configuration ── */
export interface DetailCardConfig extends Explainable {
  id?: string;
  title: string;
  subtitle?: string;
  icon?: string;
  collapsed?: boolean;        // default: false
  sections: CardSection[];
  showEditButton?: boolean;   // default: true
  showDeleteButton?: boolean; // default: true
  extraButtons?: DetailButton[];
}

/** ── Full detail view config ── */
export interface DetailViewConfig {
  cards: DetailCardConfig[];
}

/** ── Button click event ── */
export interface DetailButtonEvent {
  buttonId: string;
  cardId?: string;
  data: any;
}
