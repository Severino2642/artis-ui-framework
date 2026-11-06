import { ArtLabelComponent } from '../../core/explanation/label.component';
import {
  Component, Input, OnInit, OnDestroy, OnChanges,
  SimpleChanges, ChangeDetectorRef, HostListener
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {ComputedStat} from '../models/data-list.model';
import { formatNombre } from '../../core/models/format-number.model';

@Component({
  selector: 'art-dl-stats',
  standalone: true,
  imports: [ArtLabelComponent, CommonModule],
  templateUrl: './data-list-stats.component.html',
  styleUrls: ['./data-list-stats.component.css'],
})
export class ArtDataListStatsComponent implements OnInit, OnDestroy, OnChanges {
  @Input() stats: ComputedStat[] = [];
  /** If true, render as invoice-style summary row (no cards) */
  @Input() invoiceMode = false;

  currentIndex = 0;
  private autoTimer: any;
  private isHovered = false;
  repartition = 4;
  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void { this.startAuto(); this.detectMobile(); }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['stats']) { this.currentIndex = 0; this.cdr.markForCheck(); }
  }

  @HostListener('window:resize')
  onResize(): void { this.detectMobile(); }

  detectMobile():void{
    if (window.innerWidth <= 575){
      this.repartition = 1;
    }
    if (window.innerWidth > 575 && window.innerWidth <= 991){
      this.repartition = 2;
    }
    if (window.innerWidth > 991 && window.innerWidth <= 1260){
      this.repartition = 3;
    }
    if (window.innerWidth > 1260){
      this.repartition = 4;
    }
  }

  ngOnDestroy(): void { this.stopAuto(); }

  private startAuto(): void {
    this.autoTimer = setInterval(() => {
      if (!this.isHovered && this.stats.length > 1) {
        this.currentIndex = (this.currentIndex + 1) % this.stats.length;
        this.cdr.detectChanges();
      }
    }, 5000);
  }

  private stopAuto(): void { clearInterval(this.autoTimer); }

  goTo(i: number): void { this.currentIndex = i; }

  prev(): void {
    this.currentIndex = (this.currentIndex - 1 + this.stats.length) % this.stats.length;
  }

  next(): void {
    this.currentIndex = (this.currentIndex + 1) % this.stats.length;
  }

  onMouseEnter(): void { this.isHovered = true; }
  onMouseLeave(): void { this.isHovered = false; }

  getIndicatorClass(stat: ComputedStat): string {
    if (!stat.indicatorStyle) return '';
    const map: Record<string, string> = {
      positive: 'stat-indicator--positive',
      negative: 'stat-indicator--negative',
      neutral:  'stat-indicator--neutral',
    };
    return map[stat.indicatorStyle] ?? '';
  }

  formatComputedValue(s: ComputedStat): string {
    if (typeof s.computedValue === 'number') {
      return this.formatNombre(s.computedValue, {
        precision: s.precision,
        thousandSep: ' '
      });
    }

    if (typeof s.computedValue === 'string') {
      const num = parseFloat(s.computedValue);
      if (!isNaN(num) && isFinite(num)) {
        return this.formatNombre(num, {
          precision: s.precision,
          thousandSep: ' '
        });
      }
      return s.computedValue;
    }

    return String(s.computedValue);
  }

  /** How many cards fit in one "page" on desktop (4) */
  get visibleCards(): ComputedStat[] {
    return this.stats;
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.stats.length / this.repartition));
  }

  get activePage(): number {
    return Math.floor(this.currentIndex / this.repartition);
  }

  goToPage(p: number): void {
    this.currentIndex = p * this.repartition;
  }

  protected readonly innerWidth = innerWidth;
  protected readonly window = window;
  protected readonly formatNombre = formatNombre;
}
