import { ArtLabelComponent } from '../../core/explanation/label.component';
import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  SimpleChanges,
  ChangeDetectorRef, HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {ArtFormFieldComponent} from '../form-field/form-field.component';
import {
  ActionButtonConfig,
  ChildFormConfig,
  FieldButtonEvent, FormFieldConfig,
  FormFooterConfig
} from '../models/form-builder.model';

@Component({
  selector: 'art-form-child',
  standalone: true,
  imports: [ArtLabelComponent, CommonModule, FormsModule, ArtFormFieldComponent],
  templateUrl: './form-child.component.html',
  styleUrls: ['./form-child.component.css'],
})
export class ArtFormChildComponent implements OnInit, OnChanges {

  @Input() config!: ChildFormConfig;

  @Input() rows: Record<string, any>[] = [];
  @Output() rowsChange = new EventEmitter<Record<string, any>[]>();

  @Output() buttonClick = new EventEmitter<{ buttonId: string; rows: Record<string, any>[] }>();
  @Output() fieldButtonClick = new EventEmitter<FieldButtonEvent & { rowIndex: number }>();

  /** Quand fourni, un footer avec les boutons d'action est rendu dans fc-wrapper */
  @Input()  footerConfig?: FormFooterConfig;
  @Output() footerAction = new EventEmitter<string>();

  viewMode: 'table' | 'card' = 'table';

  /** Set of selected row indices */
  selectedRows = new Set<number>();

  /** Track collapsed state per row in card mode */
  expandedCards = new Set<number>();

  isMobile = false;

  constructor(private cdr: ChangeDetectorRef) {}

  @HostListener('window:resize')
  onResize(): void {
    this.checkViewport();
    this.cdr.markForCheck();
  }

  private checkViewport(): void {
    this.isMobile = window.innerWidth < 768;
    this.viewMode = this.isMobile ? 'card' : (this.config.defaultViewMode ?? 'table');
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['rows'] || changes['config']) this.applyDefaults();
  }

  /**
   * Complète les lignes reçues avec la valeur par défaut des champs (`defaultValue`) AVANT le rendu.
   * Sans cela, chaque champ « découvre » sa valeur par défaut en s'initialisant et la ré-émet : la ligne serait marquée modifiée.
   */
  private applyDefaults(): void {
    if (!this.config) return;
    for (const row of this.rows) {
      for (const f of this.config.fields) {
        if (row[f.name] === undefined && f.defaultValue !== undefined) row[f.name] = f.defaultValue;
      }
    }
  }

  ngOnInit(): void {
    this.applyDefaults();
    this.viewMode = this.config.defaultViewMode ?? 'table';
    this.checkViewport();
    // Start with all cards expanded
    this.rows.forEach((_, i) => this.expandedCards.add(i));
  }

  // ─────────────────────────────────────────── Rows ────────────

  /** Nombre de lignes ajoutées par le bouton groupé (`bulkAddCount`, défaut 10 ; 0 = bouton masqué). */
  get bulkCount(): number { return this.config.bulkAddCount ?? 10; }
  /** Vrai tant que `maxRows` n'est pas atteint. */
  get canAdd(): boolean { return this.config.maxRows === undefined || this.rows.length < this.config.maxRows; }
  /** Nombre de lignes réellement ajoutables par l'ajout groupé (tient compte de `maxRows`). */
  get bulkAddable(): number {
    return this.config.maxRows === undefined ? this.bulkCount : Math.max(0, Math.min(this.bulkCount, this.config.maxRows - this.rows.length));
  }

  addRow(): void { this.addRows(1); }

  /** Ajoute `count` lignes vierges (valeurs par défaut des champs) en une seule émission. */
  addRows(count: number): void {
    const room = this.config.maxRows === undefined ? count : Math.min(count, this.config.maxRows - this.rows.length);
    if (room <= 0) return;
    const created: Record<string, any>[] = [];
    for (let n = 0; n < room; n++) {
      const row: Record<string, any> = {};
      for (const f of this.config.fields) row[f.name] = f.defaultValue ?? null;
      created.push(row);
    }
    const first = this.rows.length;
    this.rows = [...this.rows, ...created];
    for (let i = first; i < this.rows.length; i++) this.expandedCards.add(i);
    this.emit();
  }

  removeRow(index: number): void {
    this.rows = this.rows.filter((_, i) => i !== index);
    this.selectedRows.delete(index);
    // Rebuild selected set with shifted indices
    const newSelected = new Set<number>();
    this.selectedRows.forEach(i => { if (i < index) newSelected.add(i); else if (i > index) newSelected.add(i - 1); });
    this.selectedRows = newSelected;
    this.emit();
  }

  removeSelected(): void {
    const toRemove = Array.from(this.selectedRows).sort((a, b) => b - a);
    toRemove.forEach(i => this.rows.splice(i, 1));
    this.rows = [...this.rows];
    this.selectedRows.clear();
    this.emit();
  }

  emit(): void {
    this.getRowsWithSatutSelected();
    this.rowsChange.emit(this.rows);
    // Indispensable en mode zoneless : un appel programmatique (ViewChild, timer, promesse) doit re-rendre le composant.
    this.cdr.markForCheck();
  }

  onFieldChange(rowIndex: number, fieldName: string, value: any): void {
    // Un champ ré-émet sa valeur à l'initialisation : sans changement réel, la ligne n'est NI modifiée NI sélectionnée
    // (sinon toutes les lignes seraient cochées à leur création, et Angular lève NG0100 en développement).
    if (this.sameValue(this.rows[rowIndex][fieldName], value)) return;
    this.rows[rowIndex][fieldName] = value;
    if (!this.selectedRows.has(rowIndex)) {
      this.selectedRows.add(rowIndex);
    }
    this.getRowsWithSatutSelected();
    this.rowsChange.emit(this.rows);
  }

  private sameValue(a: unknown, b: unknown): boolean {
    const x = a ?? null, y = b ?? null;
    if (x === y) return true;
    if (typeof x === 'object' && typeof y === 'object') {
      try { return JSON.stringify(x) === JSON.stringify(y); } catch { return false; }
    }
    return false;
  }

  getRowsWithSatutSelected(){
    for (let i = 0; i < this.rows.length; i++) {
      this.rows[i]['selected'] = this.selectedRows.has(i);
    }
  }

  // ─────────────────────────────────────────── Selection ───────

  toggleRowSelection(index: number): void {
    if (this.selectedRows.has(index)) {
      this.selectedRows.delete(index);
      this.rows[index]['selected'] = false;
    }
    else{
      this.selectedRows.add(index);
      this.rows[index]['selected'] = true;
    }
    this.rowsChange.emit(this.rows);
    this.cdr.markForCheck();
  }

  toggleSelectAll(checked: boolean): void {
    if (checked) this.rows.forEach((_, i) => this.selectedRows.add(i));
    else this.selectedRows.clear();
    this.emit();
    this.cdr.markForCheck();
  }

  get allSelected(): boolean {
    return this.rows.length > 0 && this.selectedRows.size === this.rows.length;
  }

  // ─────────────────────────────────────────── View toggle ─────

  toggleView(): void {
    this.viewMode = this.viewMode === 'table' ? 'card' : 'table';
  }

  toggleCard(index: number): void {
    if (this.expandedCards.has(index)) this.expandedCards.delete(index);
    else this.expandedCards.add(index);
    this.cdr.markForCheck();
  }

  isCardExpanded(index: number): boolean {
    return this.expandedCards.has(index);
  }

  // ─────────────────────────────────────────── Helpers ─────────

  getCardTitle(row: Record<string, any>, index: number): string {
    const firstTextField = this.config.fields.find(
      f => !f.type || f.type === 'text' || f.type === 'select' || f.type === 'autocomplete'
    );
    if (firstTextField && row[firstTextField.name]) {
      const v = row[firstTextField.name];
      return typeof v === 'object' ? JSON.stringify(v) : String(v);
    }
    return `Ligne ${index + 1}`;
  }

  onFieldBtn(event: FieldButtonEvent, rowIndex: number): void {
    this.fieldButtonClick.emit({ ...event, rowIndex });
  }

  onExtraBtn(btn: ActionButtonConfig): void {
    this.buttonClick.emit({ buttonId: btn.id, rows: this.rows });
  }

  // ─────────────────────────────────────────── Footer actions ──

  onFooterBtn(id: string): void {
    this.footerAction.emit(id);
  }

  getFooterBtnClass(btn: ActionButtonConfig): string {
    const map: Record<string, string> = {
      primary: 'fc-btn--primary',
      danger:  'fc-btn--danger',
      success: 'fc-btn--success',
      default: 'fc-btn--outline',
    };
    return `fc-btn ${map[btn.variant ?? 'default'] ?? 'fc-btn--outline'} ${btn.cssClass ?? ''}`.trim();
  }

  /** Get visible fields (where visible !== false) */
  get visibleFields(): FormFieldConfig[] {
    return this.config.fields.filter(f => f.visible !== false);
  }
}
