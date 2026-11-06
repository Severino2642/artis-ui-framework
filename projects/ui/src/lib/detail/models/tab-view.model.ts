import { Explainable } from '../../form/models/form-builder.model';
/* ================================================================
   TAB-VIEW — Models
================================================================ */
import { TemplateRef } from '@angular/core';

export interface TabConfig extends Explainable {
  /** Identifiant unique de l'onglet */
  id: string;
  /** Label affiché dans la barre */
  label: string;
  /** Icône Material Icons Outlined (optionnel) */
  icon?: string;
  /** Badge numérique (optionnel, ex: nombre d'éléments) */
  badge?: number;
  /** Template à afficher dans le contenu */
  template?: TemplateRef<any>;
  /** Désactiver cet onglet */
  disabled?: boolean;
}

export interface TabChangeEvent {
  previousId: string | null;
  currentId:  string;
}
