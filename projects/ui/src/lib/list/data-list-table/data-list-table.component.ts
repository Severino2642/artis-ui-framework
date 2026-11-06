import { ArtLabelComponent } from '../../core/explanation/label.component';
import {
  Component, Input, Output, EventEmitter, OnChanges,
  SimpleChanges, ChangeDetectorRef, HostListener, inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterLink} from "@angular/router";
import { ART_UI_TEXTS } from '../../core/i18n/ui-texts';
import { FormFieldConfig } from '../../form/models/form-builder.model';
import { ArtDataListColumnFilterComponent } from '../data-list-column-filter/data-list-column-filter.component';
import {ColumnDef, ColumnField, RowAction, SortState} from '../models/data-list.model';
import {ArtDataListUtilsService} from '../services/data-list-utils/data-list-utils.service';

@Component({
  selector: 'art-dl-table',
  standalone: true,
  imports: [ArtLabelComponent, CommonModule, RouterLink, ArtDataListColumnFilterComponent],
  templateUrl: './data-list-table.component.html',
  styleUrls: ['./data-list-table.component.css'],
})
export class ArtDataListTableComponent implements OnChanges {
  // ── Config ────────────────────────────────────────────────────
  @Input() columns: ColumnDef[] = [];
  @Input() actions: RowAction[] = [];
  @Input() showActions = true;
  @Input() showCheckbox = false;
  @Input() viewMode: 'table' | 'card' = 'table';
  @Input() isMobile: boolean = false;
  // ── Tri / filtre par colonne ──────────────────────────────────
  /** Tris actifs (pour l'indicateur et `aria-sort`). */
  @Input() activeSorts: SortState[] = [];
  /** Filtres actifs (clé = nom du champ de filtre). */
  @Input() activeFilters: Record<string, any> = {};
  /** Champ de filtre de chaque colonne `filterable` (clé = `ColumnDef.key`). */
  @Input() columnFilterFields: Record<string, FormFieldConfig> = {};
  /** Clic sur l'icône de tri d'un en-tête : émet le nouvel état de tri (vide = aucun). */
  @Output() sortChange = new EventEmitter<SortState[]>();
  /** Filtre de colonne appliqué (`value: null` = retiré). */
  @Output() columnFilter = new EventEmitter<{ field: string; value: any }>();
  /** Clic sur une valeur `filterOnClick` (égalité ; `value: null` si déjà actif = retire le filtre). */
  @Output() cellFilter = new EventEmitter<{ field: string; value: any }>();

  protected readonly texts = inject(ART_UI_TEXTS);

  // ── Data ──────────────────────────────────────────────────────
  @Input() data: any[] = [];
  @Input() allData: any[] = [];

  // ── Pagination ────────────────────────────────────────────────
  @Input() pageSize = 10;
  @Input() isAutoPagination = true;
  @Input() totalCount = 0;
  @Input() currentPage = 1;

  // ── Selected button ───────────────────────────────────────────
  @Input() selectedButtonLabel = 'Actions sélectionnées';
  @Input() selectedButtonIcon  = 'checklist';

  // ── Outputs ───────────────────────────────────────────────────
  @Output() actionClick = new EventEmitter<{ actionId: string; row: any }>();
  @Output() selectionChange = new EventEmitter<any[]>();
  @Output() selectedAction = new EventEmitter<any[]>();
  @Output() pageChange = new EventEmitter<{ start: number; end: number; page: number; pageSize: number }>();

  // ── Internal ──────────────────────────────────────────────────
  selectedRows = new Set<any>();
  expandedCards = new Set<number>();
  openActionMenuIndex = -1;
  page = 1;

  constructor(
    public utils: ArtDataListUtilsService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['currentPage']) this.page = this.currentPage;
  }

  // ─────────────────────────────────────────── Tri par en-tête ──

  /** Chemin triable d'une colonne : `sortKey`, sinon son premier attribut, sinon sa clé. */
  sortKeyOf(col: ColumnDef): string {
    return col.sortKey ?? col.sections[0]?.fields[0]?.attribute ?? col.key;
  }
  sortDir(col: ColumnDef): 'asc' | 'desc' | null {
    return this.activeSorts.find((s) => s.key === this.sortKeyOf(col))?.direction ?? null;
  }
  ariaSort(col: ColumnDef): 'ascending' | 'descending' | 'none' | null {
    if (!col.sortable) return null;
    const d = this.sortDir(col);
    return d === 'asc' ? 'ascending' : d === 'desc' ? 'descending' : 'none';
  }
  sortIcon(col: ColumnDef): string {
    const d = this.sortDir(col);
    return d === 'asc' ? 'arrow_upward' : d === 'desc' ? 'arrow_downward' : 'unfold_more';
  }
  /** Cycle : aucun → croissant → décroissant → aucun. */
  toggleSort(col: ColumnDef): void {
    const key = this.sortKeyOf(col);
    const d = this.sortDir(col);
    this.sortChange.emit(d === null ? [{ key, direction: 'asc' }] : d === 'asc' ? [{ key, direction: 'desc' }] : []);
  }

  // ─────────────────────────────────────────── Filtres ──────────

  filterValueOf(col: ColumnDef): any {
    const f = this.columnFilterFields[col.key];
    return f ? this.activeFilters[f.name] ?? null : null;
  }
  onColumnFilter(col: ColumnDef, value: any): void {
    const f = this.columnFilterFields[col.key];
    if (f) this.columnFilter.emit({ field: f.name, value });
  }
  isCellFiltered(row: any, f: ColumnField): boolean {
    const v = this.activeFilters[f.attribute];
    return v !== null && v !== undefined && String(v) === String(this.utils.deepGet(row, f.attribute));
  }
  onCellClick(f: ColumnField, row: any): void {
    if (!f.filterOnClick) return;
    this.cellFilter.emit({ field: f.attribute, value: this.isCellFiltered(row, f) ? null : this.utils.deepGet(row, f.attribute) });
  }

  // ─────────────────────────────────────────── Pagination ──────

  get visibleData(): any[] {
    if (!this.isAutoPagination) return this.data; // parent controls it
    const start = (this.page - 1) * this.pageSize;
    return this.allData.slice(start, start + this.pageSize);
  }

  get effectiveTotal(): number {
    return this.isAutoPagination ? this.allData.length : this.totalCount;
  }

  get totalPagesCount(): number {
    return Math.max(1, Math.ceil(this.effectiveTotal / this.pageSize));
  }

  get paginationLabel(): string {
    const start = (this.page - 1) * this.pageSize + 1;
    const end   = Math.min(this.page * this.pageSize, this.effectiveTotal);
    return `${start} - ${end} sur ${this.effectiveTotal}`;
  }

  get pageNumbers(): number[] {
    const total = this.totalPagesCount;
    const p = this.page;
    const pages: number[] = [];
    const delta = 2;
    for (let i = Math.max(1, p - delta); i <= Math.min(total, p + delta); i++) pages.push(i);
    if (pages[0] > 2) pages.unshift(-1, 1);
    else if (pages[0] === 2) pages.unshift(1);
    if (pages[pages.length-1] < total - 1) pages.push(-1, total);
    else if (pages[pages.length-1] === total - 1) pages.push(total);
    return pages;
  }

  goToPage(p: number): void {
    if (p < 1 || p > this.totalPagesCount || p === this.page) return;
    this.page = p;
    const start = (p - 1) * this.pageSize;
    const end   = p * this.pageSize;
    this.pageChange.emit({ start, end, page: p, pageSize: this.pageSize });
    this.cdr.markForCheck();
  }

  // ─────────────────────────────────────────── Selection ───────

  toggleRow(row: any): void {
    if (this.selectedRows.has(row)) this.selectedRows.delete(row);
    else this.selectedRows.add(row);
    this.selectionChange.emit(this.selectedArray);
    this.cdr.markForCheck();
  }

  toggleSelectAll(checked: boolean): void {
    if (checked) this.visibleData.forEach(r => this.selectedRows.add(r));
    else this.selectedRows.clear();
    this.selectionChange.emit(this.selectedArray);
    this.cdr.markForCheck();
  }

  get selectedArray(): any[] { return Array.from(this.selectedRows); }
  get allSelected(): boolean { return this.visibleData.length > 0 && this.visibleData.every(r => this.selectedRows.has(r)); }
  get someSelected(): boolean { return this.selectedRows.size > 0 && !this.allSelected; }

  onSelectedAction(): void { this.selectedAction.emit(this.selectedArray); }

  // ─────────────────────────────────────────── Actions menu ────

  toggleActionMenu(index: number, e: MouseEvent): void {
    e.stopPropagation();
    this.openActionMenuIndex = this.openActionMenuIndex === index ? -1 : index;
    this.cdr.markForCheck();
  }

  @HostListener('document:click')
  onDocClick(): void {
    if (this.openActionMenuIndex !== -1) {
      this.openActionMenuIndex = -1;
      this.cdr.markForCheck();
    }
  }

  onAction(actionId: string, row: any, e: MouseEvent): void {
    e.stopPropagation();
    this.openActionMenuIndex = -1;
    this.actionClick.emit({ actionId, row });
  }

  getActionVariantClass(variant?: string): string {
    const map: Record<string, string> = {
      danger: 'action-item--danger',
      success: 'action-item--success',
      warning: 'action-item--warning',
      secondary: 'action-item--secondary',
    };
    return map[variant ?? ''] ?? '';
  }

  // ─────────────────────────────────────────── Card view ───────

  toggleCard(i: number): void {
    if (this.expandedCards.has(i)) this.expandedCards.delete(i);
    else this.expandedCards.add(i);
    this.cdr.markForCheck();
  }

  isCardExpanded(i: number): boolean { return this.expandedCards.has(i); }

  // ─────────────────────────────────────────── Cell render ─────

  get visibleColumns(): ColumnDef[] {
    return this.columns.filter(c => c.visible !== false);
  }

  getCellValue(row: any, field: ColumnField): any {
    return this.utils.deepGet(row, field.attribute);
  }

  displayValue(row: any, field: ColumnField): string {
    const value = this.utils.getCellDisplayValue(row, field);
    return value==='' ? '-' : value;
  }

  badgeColor(row: any, field: ColumnField): string {
    return this.utils.getBadgeColor(this.getCellValue(row, field), field);
  }

  isImageField(f: ColumnField): boolean { return f.type === 'image'; }
  isBadgeField(f: ColumnField):  boolean { return f.type === 'badge'; }
  isLinkField(f: ColumnField):   boolean { return f.type === 'link'; }
  resolveLink(row: any, field: ColumnField): string {
    if (!field.linkHref) return '#';
    if (field.linkHref.startsWith('@')) {
      return String(this.utils.deepGet(row, field.linkHref.slice(1)) ?? '#');
    }
    if (field.linkHref.includes(':')) {
      let resolvedLink = field.linkHref;
      const urlPart = field.linkHref.split('/');
      for (let i = 1; i < urlPart.length; i++) {
        if (!urlPart[i].startsWith(':')) continue;
        const part = urlPart[i].replace(':', '').trim();
        const val = this.utils.deepGet(row, part);
        if (val === undefined) continue;
        resolvedLink = resolvedLink.replace(`:${part}`, String(val));
      }
      return resolvedLink;
    }
    return field.linkHref;
  }

  getCardHeaderFields(col: ColumnDef): ColumnField[] {
    if (!col.showInCardHeader) return [];
    const fields: ColumnField[] = [];
    col.sections.forEach(sec => sec.fields.forEach(f => fields.push(f)));
    return fields;
  }
}
