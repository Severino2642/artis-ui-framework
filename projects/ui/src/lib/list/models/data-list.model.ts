import { Explainable, FormFieldConfig } from '../../form/models/form-builder.model';
/* ================================================================
   DATA-LIST — Models & Interfaces (complet)
================================================================ */

import {DurationConfig} from '../../core/models/format-number.model';

export type FieldDisplayType = 'text' | 'number' | 'date' | 'image' | 'badge' | 'link';

export interface ColumnField {
  attribute: string;           // dot-notation: 'boutique.nom'
  type?: FieldDisplayType;
  style?: string;
  cssClass?: string;
  unit?: string;
  dateFormat?: string;         // ex: 'dd/MM/yyyy'
  badgeColorMap?: Record<string, string>;
  badgeDefaultColor?: string;
  linkHref?: string;
  linkTarget?: string;
  isRedirectLink?: boolean;
  formatDuration?: DurationConfig; // if type is 'number' and this config is provided, formats the number as a duration string
  maxLength?: number;            // if type is 'text', truncate the text to this length and add ellipsis
  /** Un clic sur la valeur filtre la liste sur cette valeur (égalité). Cliquer à nouveau la retire. */
  filterOnClick?: boolean;
}

export interface ColumnSection {
  fields: ColumnField[];
  colMd?: number;              // default: 12
}

export interface ColumnDef extends Explainable {
  key: string;
  title: string;
  sections: ColumnSection[];
  visible?: boolean;
  sortable?: boolean;
  width?: string;
  /**
   * Active le filtre par colonne : une icône dans l'en-tête ouvre un petit panneau.
   * `true` = champ déduit du type (texte, intervalle numérique/date, liste pour un badge) ;
   * ou un `FormFieldConfig` partiel pour le personnaliser (ex. `{ type: 'select', options: [...] }`).
   */
  filterable?: boolean | Partial<FormFieldConfig>;
  /** Chemin de la valeur utilisée pour le tri par en-tête (défaut : 1er attribut de la colonne). */
  sortKey?: string;
  showInCardHeader?: boolean;
  cardHeaderAlign?: 'left' | 'right';
}

export interface RowAction {
  id: string;
  label: string;
  icon?: string;
  variant?: 'danger' | 'success' | 'warning' | 'secondary' | 'default';
  dividerBefore?: boolean;
}

export type StatCalcMethod = 'count' | 'sum' | 'avg' | 'min' | 'max' | 'custom';

export interface StatCardConfig extends Explainable {
  id?: string;
  title: string;
  subtitle?: string;
  icon?: string;
  unit?: string;
  attribute?: string;
  calcMethod?: StatCalcMethod;
  precision?: number;
  customCalc?: (data: any[]) => number | string;
  indicatorValue?: number;
  indicatorStyle?: 'positive' | 'negative' | 'neutral';
  visible?: boolean;
  formatDuration?: DurationConfig; // if type is 'number' and this config is provided, formats the number as a duration string
}

export interface ComputedStat extends StatCardConfig {
  computedValue: string | number;
}

export interface SortField extends Explainable {
  key: string;
  label: string;
}

export interface SortState {
  key: string;
  direction: 'asc' | 'desc';
}

export type ExportFormat = 'csv' | 'excel' | 'pdf' | 'xml' | 'json';

export interface PaginationState {
  page: number;
  pageSize: number;
  start: number;
  end: number;
  total: number;
}

export interface ToolbarButton {
  id: string;
  label: string;
  icon?: string;
  variant?: 'primary' | 'default' | 'danger' | 'success' | 'warning';
}

export type LayoutMode = 'full' | 'compact' | 'invoice';

export interface DataListConfig extends Explainable {
  title?: string;
  subtitle?: string;
  columns: ColumnDef[];
  sortFields?: SortField[];
  stats?: StatCardConfig[];
  showDefaultCountCard?: boolean;
  actions?: RowAction[];
  showActions?: boolean;
  showCheckbox?: boolean;
  selectedButtonLabel?: string;
  selectedButtonIcon?: string;
  pageSize?: number;
  isAutoPagination?: boolean;
  /**
   * MODE LOCAL : le framework calcule lui-même le tri, le filtre et la pagination à partir de `data`.
   * Raccourci qui active `isAutoSorted`, `isAutoFiltered` et `isAutoPagination` (chacun reste surchargeable).
   * Sans ce mode, le framework n'émet que les événements (`sortChange`, `filterApply`, `pageChange`) et c'est
   * le parent qui fournit les données déjà triées/filtrées (mode MANUEL, ex. serveur).
   */
  localMode?: boolean;
  /** Le framework trie `data` (défaut : valeur de `localMode`). */
  isAutoSorted?:boolean;
  /** Le framework filtre `data` (défaut : valeur de `localMode`). */
  isAutoFiltered?: boolean;
  /** Prédicat de filtrage personnalisé en mode local : remplace la comparaison standard. */
  filterFn?: (row: any, filters: Record<string, any>) => boolean;
  totalCount?: number;
  defaultViewMode?: 'table' | 'card';
  layoutMode?: LayoutMode;
  toolbarButtons?: ToolbarButton[];
  isInOnglet?:boolean;
}

// Clone des mapping dans le server api

export interface FilterAttribute {
  attribute: string;
  value?: any;
  val_min?: any;
  val_max?: any;
}

export interface SortAttribute {
  attribute: string;
  direction?: 'asc' | 'desc';
}

export interface DataFilter {
  filterAttributes?: FilterAttribute[],
  sortAttributes?: SortAttribute[],
  page_min ?: number,
  page_max ?: number
}

export interface DataListDonnee {
  total ?: number;
  items ?: any[];
}
