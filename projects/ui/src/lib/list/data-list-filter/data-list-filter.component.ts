import { ArtLabelComponent } from '../../core/explanation/label.component';
import {
  Component, Input, Output, EventEmitter,
  OnInit, OnChanges, SimpleChanges, ChangeDetectorRef,
  ViewChildren, QueryList,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ArtFormFieldComponent } from '../../form/form-field/form-field.component';
import {FieldType, FormFieldConfig} from '../../form/models/form-builder.model';
import {ColumnDef} from '../models/data-list.model';

/**
 * FilterPanelConfig utilise directement FormFieldConfig.
 * Tous les types de form-builder sont donc disponibles :
 * text, number, date, time, datetime, color, select,
 * multiselect, autocomplete, interval, textarea
 * ainsi que la validation complète (FieldValidation).
 */
export interface FilterPanelConfig {
  fields: FormFieldConfig[];
}

@Component({
  selector: 'art-dl-filter',
  standalone: true,
  imports: [ArtLabelComponent, CommonModule, FormsModule, ArtFormFieldComponent],
  templateUrl: './data-list-filter.component.html',
  styleUrls: ['./data-list-filter.component.css'],
})
export class ArtDataListFilterComponent implements OnInit, OnChanges {

  @Input() filterConfig?: FilterPanelConfig;
  /** Auto-génère les champs depuis les colonnes si filterConfig est absent */
  @Input() columns: ColumnDef[] = [];
  @Input() isMobile = false;

  @Output() apply      = new EventEmitter<Record<string, any>>();
  @Output() reset      = new EventEmitter<void>();
  @Output() closePanel = new EventEmitter<void>();

  /** Valeurs courantes des filtres (bindable depuis l'extérieur) */
  @Input() filterValues: Record<string, any> = {};

  /** Champs résolus (depuis filterConfig ou auto-générés) */
  resolvedFields: FormFieldConfig[] = [];

  /** Accès aux instances ArtFormFieldComponent pour validateNow() */
  @ViewChildren(ArtFormFieldComponent)
  fieldComponents!: QueryList<ArtFormFieldComponent>;

  /** true pendant la validation async avant Apply */
  isValidating = false;

  constructor(private cdr: ChangeDetectorRef) {}

  // ─────────────────────────────────────────── Lifecycle ───────

  ngOnInit(): void { this.resolve(); }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['filterConfig'] || changes['columns']) this.resolve();
    // Un filtre posé ailleurs (icône de colonne, clic sur une valeur) doit apparaître dans le panneau.
    else if (changes['filterValues'] && !changes['filterValues'].firstChange) this.initValues();
  }

  // ─────────────────────────────────────────── Resolve ─────────

  private resolve(): void {
    if (this.filterConfig?.fields?.length) {
      this.resolvedFields = this.filterConfig.fields;
    } else {
      // Auto-génération depuis les colonnes DataList
      this.resolvedFields = this.columns.map(col => {
        const firstField = col.sections[0]?.fields[0];
        let type: FieldType = 'text';
        if (firstField?.type === 'number') type = 'interval';   // range numérique
        if (firstField?.type === 'date')   type = 'interval';   // range de dates
        if (firstField?.type === 'badge')  type = 'select';

        return {
          name:     firstField?.attribute ?? col.key,
          label:    col.title,
          type,
          colSpan:  6,
          // Pour interval auto-généré, préciser le type de base
          intervalBaseType:
            firstField?.type === 'date' ? 'date' : 'number',
        } as FormFieldConfig;
      });
    }

    this.initValues();
  }

  private initValues(): void {
    const existing = this.filterValues && Object.keys(this.filterValues).length > 0;

    const v: Record<string, any> = {};
    for (const f of this.resolvedFields) {
      if (existing && f.name in this.filterValues) {
        // Conserver la valeur existante
        v[f.name] = this.filterValues[f.name];
      } else if (f.defaultValue !== undefined) {
        v[f.name] = f.defaultValue;
      } else if (f.type === 'interval') {
        v[f.name] = { min: null, max: null };
      } else {
        v[f.name] = null;
      }
    }

    this.filterValues = v;
  }

  // ─────────────────────────────────────────── Value change ────

  onFieldChange(fieldName: string, value: any): void {
    this.filterValues = { ...this.filterValues, [fieldName]: value };
  }

  // ─────────────────────────────────────────── Apply ───────────

  async onApply(): Promise<void> {
    // 1. Valider tous les champs (utilise validateNow() de ArtFormFieldComponent)
    if (this.fieldComponents?.length) {
      this.isValidating = true;
      this.cdr.markForCheck();

      const results = await Promise.all(
        this.fieldComponents.map(fc => fc.validateNow())
      );

      this.isValidating = false;
      this.cdr.markForCheck();

      if (!results.every(r => r)) {
        // Au moins un champ invalide → ne pas émettre
        return;
      }
    }

    // 2. Nettoyer les valeurs vides avant émission
    const clean: Record<string, any> = {};

    for (const [k, v] of Object.entries(this.filterValues)) {
      if (v == null || v === '') continue;

      if (Array.isArray(v)) {
        if (v.length > 0) clean[k] = v;
        continue;
      }

      if (typeof v === 'object') {
        const sub: Record<string, any> = {};
        for (const [sk, sv] of Object.entries(v)) {
          if (sv != null && sv !== '') sub[sk] = sv;
        }
        if (Object.keys(sub).length) clean[k] = sub;
        continue;
      }

      clean[k] = v;
    }

    this.apply.emit(clean);
  }

  onReset(): void {
    // Réinitialiser sans conserver les valeurs existantes
    this.filterValues = {};
    this.resolve();
    this.reset.emit();
    this.apply.emit({});
    this.cdr.markForCheck();
  }

  // ─────────────────────────────────────────── Chip helpers ────

  isInterval(f: FormFieldConfig): boolean {
    return f.type === 'interval';
  }

  isMultiselect(f: FormFieldConfig): boolean {
    return f.type === 'multiselect';
  }

  /** Libellé affiché dans le chip d'un champ simple */
  getChipLabel(f: FormFieldConfig, value: any): string {
    if (f.type === 'select' && f.options?.length) {
      const vKey = f.optionValueKey ?? 'value';
      const lKey = f.optionLabelKey ?? 'label';
      const opt  = f.options.find(o => o[vKey] === value);
      return opt ? opt[lKey] : String(value);
    }
    if (f.type === 'date' || f.type === 'datetime') {
      return new Date(value).toLocaleDateString('fr-FR');
    }
    return String(value);
  }

  /** Libellés pour un champ multiselect (tableau) */
  getMultiselectLabels(f: FormFieldConfig, values: any[]): string[] {
    if (!f.options?.length) return values.map(String);
    const vKey = f.optionValueKey ?? 'value';
    const lKey = f.optionLabelKey ?? 'label';
    return values.map(v => {
      const opt = f.options!.find(o => o[vKey] === v);
      return opt ? opt[lKey] : String(v);
    });
  }

  removeMultiselectValue(fieldName: string, valueToRemove: any): void {
    const current: any[] = this.filterValues[fieldName] ?? [];
    this.filterValues = {
      ...this.filterValues,
      [fieldName]: current.filter(v => v !== valueToRemove),
    };
  }

  clearField(fieldName: string, f: FormFieldConfig): void {
    if (f.type === 'interval') {
      this.filterValues = { ...this.filterValues, [fieldName]: { min: null, max: null } };
    } else if (f.type === 'multiselect') {
      this.filterValues = { ...this.filterValues, [fieldName]: [] };
    } else {
      this.filterValues = { ...this.filterValues, [fieldName]: null };
    }
  }

  /** Nombre de filtres actifs (non vides) */
  get activeCount(): number {
    return Object.entries(this.filterValues).filter(([, v]) => {
      if (v == null || v === '') return false;
      if (Array.isArray(v))     return v.length > 0;
      if (typeof v === 'object') return Object.values(v).some(x => x != null && x !== '');
      return true;
    }).length;
  }

  /** true si un champ a une valeur non vide */
  hasValue(f: FormFieldConfig): boolean {
    const v = this.filterValues[f.name];
    if (v == null || v === '')    return false;
    if (Array.isArray(v))         return v.length > 0;
    if (f.type === 'interval')    return v?.min != null || v?.max != null;
    return true;
  }

  getColClass(f: FormFieldConfig): string {
    return `col-12 col-md-${f.colSpan ?? 6}`;
  }
}
