import {
  Component, Input, Output, EventEmitter,
  HostListener, ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {SortField, SortState} from '../models/data-list.model';

@Component({
  selector: 'art-dl-sort',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './data-list-sort.component.html',
  styleUrls: ['./data-list-sort.component.css'],
})
export class ArtDataListSortComponent {
  @Input() fields: SortField[] = [];
  @Input() isMobile = false;
  /** Tris actifs posés de l'extérieur (ex. clic sur un en-tête de colonne) : la barre reste synchronisée. */
  @Input() set activeSorts(v: SortState[] | null | undefined) {
    this.sorts = new Map((v ?? []).map((x) => [x.key, x.direction] as [string, 'asc' | 'desc']));
  }
  @Output() sortChange = new EventEmitter<SortState[]>();

  isOpen = false;
  openFieldKey: string | null = null;
  /** All active sorts */
  sorts: Map<string, 'asc' | 'desc'> = new Map();

  toggle(): void { this.isOpen = !this.isOpen; if (!this.isOpen) this.openFieldKey = null; }
  close(): void  { this.isOpen = false; this.openFieldKey = null; }

  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent): void {
    if (!(e.target as HTMLElement).closest('.sort-wrapper')) this.close();
  }

  toggleField(key: string, e: MouseEvent): void {
    e.stopPropagation();
    this.openFieldKey = this.openFieldKey === key ? null : key;
  }

  pickDirection(key: string, dir: 'asc' | 'desc', e: MouseEvent): void {
    e.stopPropagation();
    this.sorts.set(key, dir);
    this.openFieldKey = null;
    this.emit();
  }

  removeSort(key: string): void {
    this.sorts.delete(key);
    this.emit();
  }

  clearAll(): void { this.sorts.clear(); this.emit(); }

  private emit(): void {
    const result: SortState[] = Array.from(this.sorts.entries()).map(([key, direction]) => ({ key, direction }));
    this.sortChange.emit(result);
  }

  getLabel(key: string): string {
    return this.fields.find(f => f.key === key)?.label ?? key;
  }

  get sortKeys(): string[] { return Array.from(this.sorts.keys()); }

  get activeCount(): number { return this.sorts.size; }
}
