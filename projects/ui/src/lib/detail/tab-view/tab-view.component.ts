import {
  Component, Input, Output, EventEmitter,
  OnInit, OnChanges, SimpleChanges,
  AfterViewInit, OnDestroy,
  ChangeDetectorRef, ElementRef, NgZone,
  ViewChild, HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {TabChangeEvent, TabConfig} from '../models/tab-view.model';

@Component({
  selector:    'art-tab-view',
  standalone:  true,
  imports:     [CommonModule],
  templateUrl: './tab-view.component.html',
  styleUrls:   ['./tab-view.component.css'],
})
export class ArtTabViewComponent implements OnInit, AfterViewInit, OnDestroy {

  // ── Inputs ────────────────────────────────────────────────────
  @Input() tabs:       TabConfig[] = [];
  /** Id de l'onglet actif par défaut */
  @Input() activeTabId?: string;

  // ── Outputs ───────────────────────────────────────────────────
  @Output() tabChange = new EventEmitter<TabChangeEvent>();

  // ── Refs ──────────────────────────────────────────────────────
  @ViewChild('tabBar')     tabBarRef!:     ElementRef<HTMLElement>;
  @ViewChild('tabBarInner') tabBarInnerRef!: ElementRef<HTMLElement>;

  // ── State ─────────────────────────────────────────────────────
  activeId: string | null = null;
  isMobile = false;

  /** true si la barre peut défiler (contenu plus large que le conteneur) */
  canScrollLeft  = false;
  canScrollRight = false;

  private resizeObserver?: ResizeObserver;
  private scrollRaf?: number;

  constructor(
    private cdr:  ChangeDetectorRef,
    private zone: NgZone,
    private host: ElementRef,
  ) {}

  // ── Lifecycle ─────────────────────────────────────────────────

  ngOnInit(): void {
    this.detectMobile();
    this.initActiveTab();
  }

  ngAfterViewInit(): void {
    this.setupResizeObserver();
    this.updateScrollIndicators();
    // Scroll initial vers l'onglet actif
    setTimeout(() => this.scrollActiveTabIntoView('auto'), 100);
  }

  // ngOnChanges(changes: SimpleChanges): void {
  //   // if (changes['tabs'] && !changes['tabs'].firstChange) {
  //   //   this.initActiveTab();
  //   // }
  //   // if (changes['activeTabId'] && !changes['activeTabId'].firstChange) {
  //   //   const newId = changes['activeTabId'].currentValue;
  //   //   if (newId && newId !== this.activeId) {
  //   //     this.setActive(newId, false);
  //   //   }
  //   // }
  // }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    if (this.scrollRaf) cancelAnimationFrame(this.scrollRaf);
  }

  @HostListener('window:resize')
  onWindowResize(): void { this.detectMobile(); this.updateScrollIndicators(); }

  // ── Init ──────────────────────────────────────────────────────

  private detectMobile(): void {
    this.isMobile = window.innerWidth < 768;
    this.cdr.markForCheck();
  }

  private initActiveTab(): void {
    if (!this.tabs?.length) return;
    const requested = this.activeTabId
      ? this.tabs.find(t => t.id === this.activeTabId && !t.disabled)
      : null;
    this.activeId = requested?.id ?? this.tabs.find(t => !t.disabled)?.id ?? null;
    this.cdr.markForCheck();
  }

  private setupResizeObserver(): void {
    if (typeof ResizeObserver === 'undefined') return; // SSR / environnements sans ResizeObserver
    if (!this.tabBarRef?.nativeElement) return;
    this.resizeObserver = new ResizeObserver(() => {
      this.zone.run(() => this.updateScrollIndicators());
    });
    this.resizeObserver.observe(this.tabBarRef.nativeElement);
  }

  // ── Tab switching ─────────────────────────────────────────────

  setActive(id: string, emit = true): void {
    const tab = this.tabs.find(t => t.id === id);
    if (!tab || tab.disabled || id === this.activeId) return;

    const previous = this.activeId;
    this.activeId  = id;
    this.cdr.markForCheck();

    if (emit) this.tabChange.emit({ previousId: previous, currentId: id });

    // Scroll vers l'onglet actif
    requestAnimationFrame(() => this.scrollActiveTabIntoView('smooth'));
  }

  // ── Scroll helpers ────────────────────────────────────────────

  /**
   * Fait défiler la barre pour que l'onglet actif soit toujours visible.
   *
   * Logique "sticky intelligente" :
   *  - Si l'onglet est partiellement caché à gauche → scroll pour le coller à gauche
   *  - Si l'onglet est partiellement caché à droite → scroll pour le coller à droite
   *  - Sinon → pas de scroll (il est déjà visible)
   */
  private scrollActiveTabIntoView(behavior: ScrollBehavior = 'smooth'): void {
    const bar   = this.tabBarRef?.nativeElement;
    const inner = this.tabBarInnerRef?.nativeElement;
    if (!bar || !inner || !this.activeId) return;

    const activeEl = inner.querySelector(`[data-tab-id="${this.activeId}"]`) as HTMLElement | null;
    if (!activeEl) return;

    const barRect    = bar.getBoundingClientRect();
    const activeRect = activeEl.getBoundingClientRect();

    const scrollLeft = bar.scrollLeft;
    const padding    = 12;   // espace de confort autour du tab actif

    if (activeRect.left < barRect.left + padding) {
      // Caché à gauche → le ramener au bord gauche
      bar.scrollTo?.({ left: scrollLeft + (activeRect.left - barRect.left) - padding, behavior });
    } else if (activeRect.right > barRect.right - padding) {
      // Caché à droite → le ramener au bord droit
      bar.scrollTo?.({ left: scrollLeft + (activeRect.right - barRect.right) + padding, behavior });
    }

    this.updateScrollIndicators();
  }

  onTabBarScroll(): void {
    if (this.scrollRaf) cancelAnimationFrame(this.scrollRaf);
    this.scrollRaf = requestAnimationFrame(() => {
      this.updateScrollIndicators();
      this.cdr.markForCheck();
    });
  }

  private updateScrollIndicators(): void {
    const bar = this.tabBarRef?.nativeElement;
    if (!bar) return;
    const tolerance    = 2;
    this.canScrollLeft  = bar.scrollLeft > tolerance;
    this.canScrollRight = bar.scrollLeft < (bar.scrollWidth - bar.clientWidth - tolerance);
    this.cdr.markForCheck();
  }

  scrollBar(direction: 'left' | 'right'): void {
    const bar = this.tabBarRef?.nativeElement;
    if (!bar) return;
    const step = 160;
    bar.scrollBy({ left: direction === 'right' ? step : -step, behavior: 'smooth' });
    setTimeout(() => this.updateScrollIndicators(), 320);
  }

  // ── Helpers ───────────────────────────────────────────────────

  isActive(id: string): boolean { return this.activeId === id; }

  /** Navigation clavier (WAI-ARIA Tabs) : ← → passent d'un onglet actif à l'autre, Début/Fin vont aux extrémités. */
  onTabKeydown(e: KeyboardEvent): void {
    const enabled = this.tabs.filter((t) => !t.disabled);
    const i = enabled.findIndex((t) => t.id === this.activeId);
    let next = -1;
    if (e.key === 'ArrowRight') next = (i + 1) % enabled.length;
    else if (e.key === 'ArrowLeft') next = (i - 1 + enabled.length) % enabled.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = enabled.length - 1;
    if (next < 0 || !enabled.length) return;
    e.preventDefault();
    this.setActive(enabled[next].id);
    queueMicrotask(() => (e.currentTarget as HTMLElement | null)?.querySelector<HTMLElement>('[role=tab][tabindex="0"]')?.focus());
  }


  get activeTab(): TabConfig | undefined {
    return this.tabs.find(t => t.id === this.activeId);
  }
}
