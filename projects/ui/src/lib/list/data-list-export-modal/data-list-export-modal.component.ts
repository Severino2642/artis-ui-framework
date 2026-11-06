import {
  Component, Input, Output, EventEmitter, OnInit, ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {ColumnDef, ExportFormat} from '../models/data-list.model';
import {ArtDataListUtilsService} from '../services/data-list-utils/data-list-utils.service';

interface FormatCard {
  id: ExportFormat;
  label: string;
  icon: string;
  color: string;
}

export interface FetchPageEvent {
  page?: number;
  format: string;
  columnKeys: string[];
  isAllData: boolean;
  onDataReady?: (data: any[]) => void;
}

@Component({
  selector: 'art-dl-export-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './data-list-export-modal.component.html',
  styleUrls: ['./data-list-export-modal.component.css'],
})
export class ArtDataListExportModalComponent implements OnInit {
  @Input() columns: ColumnDef[] = [];
  @Input() allData: any[] = [];
  @Input() currentPageData: any[] = [];
  @Input() isAutoPagination = true;
  @Input() totalPages = 1;
  @Input() currentPage = 1;
  @Input() listTitle = 'Export';
  @Input() totalDataCount = 0;

  @Output() close = new EventEmitter<void>();
  /** Emitted when we need the parent to provide a specific page's data */
  @Output() fetchPage = new EventEmitter<FetchPageEvent>();

  selectedFormat: ExportFormat = 'csv';
  selectedColumns: Set<string> = new Set();
  pageMode: 'all' | 'current' | 'page' = 'all';
  targetPage = 1;

  formats: FormatCard[] = [
    { id: 'csv',   label: 'CSV',   icon: 'table_chart',  color: 'var(--art-success)' },
    { id: 'excel', label: 'Excel', icon: 'grid_on',       color: 'var(--art-success-strong)' },
    { id: 'pdf',   label: 'PDF',   icon: 'picture_as_pdf',color: 'var(--art-danger)' },
    { id: 'xml',   label: 'XML',   icon: 'code',          color: 'var(--art-accent)' },
    { id: 'json',  label: 'JSON',  icon: 'data_object',   color: 'var(--art-primary)' },
  ];

  constructor(
    private utils: ArtDataListUtilsService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Pre-select all visible columns
    this.columns.filter(c => c.visible !== false).forEach(c => this.selectedColumns.add(c.key));
    this.targetPage = this.currentPage;
  }

  selectFormat(f: ExportFormat): void { this.selectedFormat = f; }

  toggleColumn(key: string): void {
    if (this.selectedColumns.has(key)) this.selectedColumns.delete(key);
    else this.selectedColumns.add(key);
  }

  selectAllColumns(): void {
    this.columns.forEach(c => this.selectedColumns.add(c.key));
  }

  deselectAllColumns(): void { this.selectedColumns.clear(); }

  get selectedCols(): ColumnDef[] {
    return this.columns.filter(c => this.selectedColumns.has(c.key));
  }

  doExport(): void {
    const cols = this.selectedCols;
    let data: any[];

    if (this.pageMode === 'current') {
      data = this.currentPageData;
      this.runExport(data, cols);
    } else if (this.pageMode === 'page') {
      if (this.isAutoPagination || this.currentPage==this.targetPage) {
        // Data already in memory — slice it
        const ps = Math.ceil(this.allData.length / Math.max(this.totalPages, 1));
        const start = (this.targetPage - 1) * ps;
        data = this.allData.slice(start, start + ps);
        this.runExport(data, cols);
      } else {
        // Need parent to provide data
        this.fetchPage.emit({
          page: this.targetPage,
          format: this.selectedFormat,
          columnKeys: Array.from(this.selectedColumns),
          isAllData: false,
          onDataReady: (fetchedData) => this.runExport(fetchedData, cols)
        });
      }
    } else {
      if (this.isAutoPagination || this.totalDataCount == this.allData.length) {
        data = this.allData;
        this.runExport(data, cols);
      } else {
        // If not auto-pagination, we might not have all data in memory. We can only export what we have.
        this.fetchPage.emit({
          page: this.targetPage,
          format: this.selectedFormat,
          columnKeys: Array.from(this.selectedColumns),
          isAllData: true,
          onDataReady: (fetchedData) => this.runExport(fetchedData, cols)
        });
      }
    }

  }

  runExport(data: any[], cols: ColumnDef[]): void {
    const title = this.listTitle;
    switch (this.selectedFormat) {
      case 'csv':   this.utils.exportCSV(data, cols, `${title}.csv`); break;
      case 'excel': this.utils.exportExcel(data, cols, `${title}.xls`); break;
      case 'pdf':   this.utils.exportPDF(data, cols, title, `${title}.pdf`); break;
      case 'xml':   this.utils.exportXML(data, cols, `${title}.xml`); break;
      case 'json':  this.utils.exportJSON(data, cols, `${title}.json`); break;
    }
    this.close.emit();
  }

  getFormatColor(id: ExportFormat): string {
    return this.formats.find(f => f.id === id)?.color ?? 'var(--art-primary)';
  }

  get pageOptions(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }
}
