import { FormFieldConfig } from '../../form/models/form-builder.model';
import { ArtLabelComponent } from '../../core/explanation/label.component';
import {
  Component, Input, Output, EventEmitter,
  OnInit, OnChanges, SimpleChanges, ChangeDetectorRef,
  HostListener, ViewChild, ElementRef, OnDestroy, AfterViewInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ArtDataListStatsComponent } from '../data-list-stats/data-list-stats.component';
import { ArtDataListTableComponent } from '../data-list-table/data-list-table.component';
import { ArtDataListSortComponent } from '../data-list-sort/data-list-sort.component';
import {ArtDataListExportModalComponent, FetchPageEvent} from '../data-list-export-modal/data-list-export-modal.component';
import { ArtDataListFilterComponent, FilterPanelConfig } from '../data-list-filter/data-list-filter.component';
import {
  ColumnDef,
  ComputedStat,
  DataListConfig,
  LayoutMode,
  SortState
} from '../models/data-list.model';
import {ArtDataListUtilsService} from '../services/data-list-utils/data-list-utils.service';

@Component({
  selector: 'art-data-list',
  standalone: true,
  imports: [ArtLabelComponent, 
    CommonModule,
    ArtDataListStatsComponent,
    ArtDataListTableComponent,
    ArtDataListSortComponent,
    ArtDataListExportModalComponent,
    ArtDataListFilterComponent,
  ],
  templateUrl: './data-list.component.html',
  styleUrls: ['./data-list.component.css'],
})
export class ArtDataListComponent implements OnInit, OnChanges , OnDestroy , AfterViewInit {
  @ViewChild('tableContainer') tableContainerRef?: ElementRef<HTMLElement>;
  /** ResizeObserver pour détecter quand le tableau ne rétrécit plus */
  private tableResizeObserver?: ResizeObserver;

  @Input() config!: DataListConfig;
  @Input() data: any[] = [];
  /** Optional explicit filter panel config — auto-generated from columns if omitted */
  @Input() filterPanelConfig?: FilterPanelConfig;

  // ── Outputs ───────────────────────────────────────────────────
  @Output() filterApply     = new EventEmitter<Record<string, any>>();
  @Output() sortChange      = new EventEmitter<SortState[]>();
  @Output() actionClick     = new EventEmitter<{ actionId: string; row: any }>();
  @Output() selectionAction = new EventEmitter<any[]>();
  @Output() pageChange      = new EventEmitter<{ start: number; end: number; page: number; pageSize: number }>();
  @Output() toolbarAction   = new EventEmitter<string>();
  /** When isAutoPagination=false and export needs a specific page */
  @Output() exportFetchPage = new EventEmitter<FetchPageEvent>();

  // ── State ─────────────────────────────────────────────────────
  isMobile = false;
  showToolbarActions = false;
  viewMode: 'table' | 'card' = 'table';
  layoutMode: LayoutMode = 'full';

  showFilterPanel  = false;
  showExportModal  = false;

  activeFilterCount = 0;
  activeFilters: Record<string, any> = {};

  /** Champs de filtre effectifs (panneau personnalisé ou déduits des colonnes) — donnent le type de chaque filtre. */
  filterFields: FormFieldConfig[] = [];
  /** Config passée au panneau de filtres (toujours définie : champs personnalisés ou auto-générés). */
  effectiveFilterConfig: FilterPanelConfig = { fields: [] };
  /** Champ de filtre de chaque colonne `filterable`. */
  columnFilterFields: Record<string, FormFieldConfig> = {};

  activeSorts: SortState[] = [];
  processedData: any[] = [];
  computedStats: ComputedStat[] = [];

  currentPage = 1;
  currentPageData: any[] = [];

  constructor(
    private utils: ArtDataListUtilsService,
    private cdr: ChangeDetectorRef
  ) {}

  // ─────────────────────────────────────────── Lifecycle ───────

  ngOnInit(): void {
    this.applyConfig();
    this.detectMobile();
    this.updateFilterFields();
    this.process();
  }

  ngOnChanges(changes: SimpleChanges): void {

    if (changes['data'] || changes['config'] || changes['filterPanelConfig']) {
      this.applyConfig();
      this.detectMobile();
      this.updateFilterFields();
      this.process();
      this.updateVisibleColumns();
    }
  }

  ngAfterViewInit(): void {
    this.initTableOverflowObserver();
  }

  ngOnDestroy(): void {
    this.tableResizeObserver?.disconnect();
  }

  @HostListener('window:resize')
  onResize(): void { this.detectMobile(); }

  // ─────────────────────────────────────────── Setup ───────────
  /**
   * Observe le conteneur du tableau.
   * Dès que le contenu (scrollWidth) dépasse le conteneur (offsetWidth),
   * le tableau ne peut plus rétrécir → on bascule automatiquement en mode card.
   * Dès qu'il y a à nouveau assez de place, on repasse en mode table.
   */
  private initTableOverflowObserver(): void {
    const container = this.tableContainerRef?.nativeElement;
    if (!container) return;
    if (typeof ResizeObserver === 'undefined') return; // SSR / environnements de test sans ResizeObserver

    this.tableResizeObserver = new ResizeObserver(() => {
      this.checkTableOverflow(container);
    });

    this.tableResizeObserver.observe(container);

    // Vérification initiale immédiate
    this.checkTableOverflow(container);
  }

  private checkTableOverflow(container: HTMLElement): void {
    // Ne rien faire si l'utilisateur a explicitement choisi le mode card
    if (this.config?.defaultViewMode === 'card') return;

    const table = container.querySelector('table') as HTMLElement | null;
    if (!table) return;

    const isOverflowing = table.scrollWidth > container.offsetWidth;

    if (isOverflowing && this.viewMode === 'table') {
      this.viewMode = 'card';
      this.cdr.markForCheck();
    } else if (!isOverflowing && this.viewMode === 'card' && !this.isMobile) {
      // Assez de place et pas sur mobile → repasser en table
      this.viewMode = 'table';
      this.cdr.markForCheck();
    }
  }

  private detectMobile(): void {
    const was = this.isMobile;
    this.isMobile = window.innerWidth < 768;
    // Auto switch to card view on mobile
    if (this.isMobile) {
      this.viewMode = 'card';
    }
    if (!this.isMobile) this.showToolbarActions = false;
    this.cdr.markForCheck();
  }


  private applyConfig(): void {
    if (!this.config) return;
    this.layoutMode = this.config.layoutMode ?? 'full';
    this.viewMode   = this.config.defaultViewMode ?? (this.isMobile ? 'card' : 'table');
  }

  /** Le framework trie lui-même (`localMode`, ou `isAutoSorted` explicite). */
  get autoSort(): boolean { return this.config?.isAutoSorted ?? !!this.config?.localMode; }
  /** Le framework filtre lui-même (`localMode`, ou `isAutoFiltered` explicite). */
  get autoFilter(): boolean { return this.config?.isAutoFiltered ?? !!this.config?.localMode; }

  /** Champs de filtre : ceux du panneau personnalisé, sinon déduits des colonnes (+ colonnes `filterable`). */
  private updateFilterFields(): void {
    if (!this.config) return;
    const cols = this.config.columns ?? [];
    this.columnFilterFields = {};
    for (const c of cols) if (c.filterable) this.columnFilterFields[c.key] = this.utils.columnFilterField(c, this.data);
    const panel = this.filterPanelConfig?.fields?.length ? this.filterPanelConfig.fields : this.utils.autoFilterFields(cols, this.data);
    this.effectiveFilterConfig = { fields: panel };
    // Pour comparer : les champs du panneau + ceux des colonnes filtrables qui n'y figurent pas.
    const extra = Object.values(this.columnFilterFields).filter((cf) => !panel.some((p) => p.name === cf.name));
    this.filterFields = [...panel, ...extra];
  }

  private process(): void {
    if (!this.config) return;
    let d = [...this.data];
    if (this.autoFilter && this.activeFilterCount > 0) {
      d = this.utils.filterData(d, this.activeFilters, this.filterFields, this.config.filterFn);
    }
    if (this.autoSort && this.activeSorts.length) {
      d = this.utils.sortData(d, this.activeSorts);
    }
    this.processedData = d;
    this.computeStats();
    this.updatePageData();
  }

  private computeStats(): void {
    const stats = this.config.stats ?? [];
    const all: ComputedStat[] = [];

    // Default count card
    if (this.config.showDefaultCountCard !== false) {
      all.push({
        id: '__count',
        title: 'Total',
        subtitle: 'Enregistrements',
        icon: 'view_list',
        computedValue: this.processedData.length,
        visible: true,
      });
    }

    // Custom stat cards
    stats.filter(s => s.visible !== false).forEach(s => {
      all.push({
        ...s,
        computedValue: this.utils.computeStat(s, this.processedData),
      });
    });

    this.computedStats = all;
  }

  private updatePageData(): void {
    if (this.config.isAutoPagination !== false) {
      const ps = this.config.pageSize ?? 10;
      const start = (this.currentPage - 1) * ps;
      this.currentPageData = this.processedData.slice(start, start + ps);
    }else {
      this.currentPageData = this.processedData;
    }
  }

  // ─────────────────────────────────────────── Toolbar ─────────

  toggleFilterPanel(): void { this.showFilterPanel = !this.showFilterPanel; }
  toggleExportModal(): void { this.showExportModal = !this.showExportModal; }
  toggleViewMode():   void { this.viewMode = this.viewMode === 'table' ? 'card' : 'table'; }
  toggleToolbarActions(): void { this.showToolbarActions = !this.showToolbarActions; }

  onRefresh(): void { this.process(); }

  /**
   * Tri demandé (barre de tri ou en-tête de colonne). En mode local le framework retrie `data` ;
   * l'événement `sortChange` est émis dans TOUS les modes (mode manuel : le parent fournit alors des données déjà triées).
   */
  onSortChange(sorts: SortState[]): void {
    this.activeSorts = sorts;
    this.currentPage = 1;
    this.process();
    this.sortChange.emit(sorts);
    this.cdr.markForCheck();
  }

  /** Filtres du panneau appliqués. Même principe : recalcul local si `autoFilter`, événement `filterApply` toujours émis. */
  onFilterApply(values: Record<string, any>): void {
    this.showFilterPanel = false;
    this.setFilters(values);
  }

  /** Filtre d'une colonne (icône d'en-tête). `value: null` retire le filtre de cette colonne. */
  onColumnFilter(e: { field: string; value: any }): void {
    const next = { ...this.activeFilters };
    if (this.utils.hasFilterValue(e.value)) next[e.field] = e.value; else delete next[e.field];
    this.setFilters(next);
  }

  /** Clic sur une valeur (`filterOnClick`) : filtre par égalité ; adapte la valeur si le champ est un intervalle. */
  onCellFilter(e: { field: string; value: any }): void {
    const f = this.filterFields.find((x) => x.name === e.field);
    let value = e.value;
    if (value !== null && f?.type === 'interval') value = { min: value, max: value };
    this.onColumnFilter({ field: e.field, value });
  }

  private setFilters(values: Record<string, any>): void {
    this.activeFilters = values;
    this.activeFilterCount = Object.values(values).filter((v) => this.utils.hasFilterValue(v)).length;
    this.currentPage = 1;
    this.process();
    this.filterApply.emit(values);
    this.cdr.markForCheck();
  }

  onToolbarButton(id: string): void { this.toolbarAction.emit(id); }

  // ─────────────────────────────────────────── Page change ─────

  onPageChange(e: { start: number; end: number; page: number; pageSize: number }): void {
    this.currentPage = e.page;
    this.updatePageData();
    if (!this.config.isAutoPagination) this.pageChange.emit(e);
  }

  get totalPages(): number {
    const ps = this.config?.pageSize ?? 10;
    const total = this.config?.isAutoPagination !== false
      ? this.processedData.length
      : (this.config.totalCount ?? this.processedData.length);
    return Math.max(1, Math.ceil(total / ps));
  }

  // ─────────────────────────────────────────── Helpers ─────────

  visibleColumns : ColumnDef[] = [];

  updateVisibleColumns(): void {
    this.visibleColumns = (this.config?.columns ?? []).filter(c => c.visible !== false);
  }

  get hasStats(): boolean { return this.computedStats.length > 0; }

  get filterActive(): boolean { return this.activeFilterCount > 0; }

  getToolbarBtnClass(v?: string): string {
    const map: Record<string, string> = {
      primary: 'dl-btn--primary',
      danger:  'dl-btn--danger',
      success: 'dl-btn--success',
      warning: 'dl-btn--warning',
    };
    return `dl-btn ${map[v ?? ''] ?? 'dl-btn--default'}`;
  }
}
