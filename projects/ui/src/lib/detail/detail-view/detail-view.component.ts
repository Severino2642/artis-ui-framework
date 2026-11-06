import {
  Component, Input, Output, EventEmitter,
  OnInit, OnChanges, SimpleChanges,
  HostListener, ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ArtDetailCardComponent } from '../detail-card/detail-card.component';
import {DetailButtonEvent, DetailViewConfig} from '../models/detail-view.model';

@Component({
  selector: 'art-detail-view',
  standalone: true,
  imports: [CommonModule, ArtDetailCardComponent],
  templateUrl: './detail-view.component.html',
  styleUrls: ['./detail-view.component.css'],
})
export class ArtDetailViewComponent implements OnInit, OnChanges {

  // ── Inputs ────────────────────────────────────────────────────
  @Input() config!: DetailViewConfig;
  @Input() data: any = {};

  // ── Outputs ───────────────────────────────────────────────────
  @Output() buttonClick = new EventEmitter<DetailButtonEvent>();

  // ── State ─────────────────────────────────────────────────────
  isMobile = false;

  constructor(private cdr: ChangeDetectorRef) {}

  // ── Lifecycle ─────────────────────────────────────────────────
  ngOnInit(): void { this.checkMobile(); }

  ngOnChanges(changes: SimpleChanges): void { /* reactive */ }

  @HostListener('window:resize')
  onResize(): void { this.checkMobile(); }

  private checkMobile(): void {
    this.isMobile = window.innerWidth < 768;
    this.cdr.markForCheck();
  }

  // ── Handlers ──────────────────────────────────────────────────
  onCardButtonClick(event: DetailButtonEvent): void {
    this.buttonClick.emit(event);
  }
}
