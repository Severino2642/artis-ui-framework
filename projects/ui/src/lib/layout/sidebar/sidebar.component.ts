import {
  Component,
  Input,
  OnInit,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  HostListener,
  HostBinding,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  NgZone,
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {NavbarItemCPLModel} from '../models/navbar-item.model';

export interface SidebarUser {
  name: string;
  email: string;
  avatar?: string;
}

/** Describes one open level-4+ popup rendered as a portal */
export interface PopupState {
  item: NavbarItemCPLModel;
  top: number;
  left: number;
}

/** Describes the level-1 flyout shown in collapsed mode, rendered as a portal */
export interface FlyoutState {
  item: NavbarItemCPLModel;
  top: number;
  left: number;
}

@Component({
  selector: 'art-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArtSidebarComponent implements OnInit, OnChanges, OnDestroy {
  /** Affiche le contenu projeté `[artSidebarPanel]` à la place de la navigation (ex. panneau d'outils). */
  /** Nom de la marque affiché à côté du logo. */
  @Input() brandName = '';
  /** URL du logo (aucun logo si vide). */
  @Input() logoUrl = '';
  @Input() alternatePanel: boolean = false;

  @Input() navItems: NavbarItemCPLModel[] = [];
  @Input() user: SidebarUser = { name: '', email: '' };
  @Input() activeSideBar ?: NavbarItemCPLModel;
  @Output() itemSelected = new EventEmitter<[NavbarItemCPLModel, NavbarItemCPLModel[]]>();
  @Output() onUserButtonClick = new EventEmitter<string>();

  /** Émet la largeur effective (px) à chaque changement (collapse/expand,
   *  resize manuel, bascule mobile) pour que le layout parent ajuste
   *  son `margin-left`. */
  @Output() widthChange = new EventEmitter<number>();

  /** true pendant tout le drag de redimensionnement, false sinon — permet
   *  au parent de désactiver ses transitions CSS pour un suivi 1:1. */
  @Output() resizingChange = new EventEmitter<boolean>();

  // ── Sidebar state ────────────────────────────────────────────────
  sidebarCollapsed = false;
  mobileOpen = false;
  isMobile = false;

  // ── Largeur redimensionnable (drag sur le bord droit) ───────────
  /** Largeur courante en px en mode déplié/desktop. Le bord gauche
   *  reste fixe (sidebar = position: fixed; left: 0), donc redimensionner
   *  revient juste à changer cette valeur. */
  sidebarWidth = 240;
  readonly collapsedWidth = 68;
  readonly minWidth = 200;
  readonly maxWidth = 480;
  isResizing = false;

  /** Largeur qui doit réellement s'appliquer maintenant. */
  get effectiveWidth(): number {
    if (this.isMobile) return this.sidebarWidth;
    return this.sidebarCollapsed ? this.collapsedWidth : this.sidebarWidth;
  }

  /** Variable CSS --sidebar-w posée sur le host (art-sidebar) afin que
   *  TOUS les descendants (aside, mobile-fab, resize handle…) la voient. */
  @HostBinding('style.--sidebar-w')
  get sidebarWidthCssVar(): string {
    return this.effectiveWidth + 'px';
  }

  // ── Search ───────────────────────────────────────────────────────
  searchQuery = '';
  searchResults: NavbarItemCPLModel[] = [];
  showSearchResults = false;

  // ── Nav accordion ────────────────────────────────────────────────
  expandedIds = new Set<string>();
  activeItemId = '';

  // ── Collapsed icon hover → flyout en portail (level 1, mode replié) ─
  hoveredFlyout: FlyoutState | null = null;
  private flyoutCloseTimer: any = null;
  /** Délai avant fermeture du flyout après avoir quitté l'icône ou le
   *  flyout lui-même — laisse le temps au curseur de traverser le petit
   *  espace entre les deux sans perdre le hover. */
  private readonly flyoutCloseDelay = 250;

  // ── Popup portals (level ≥ 3) ────────────────────────────────────
  openPopups: PopupState[] = [];

  // ── User dropdown ─────────────────────────────────────────────────
  userMenuOpen = false;

  constructor(private cdr: ChangeDetectorRef, private ngZone: NgZone) {}

  // ─────────────────────────────────────────── Lifecycle ───────────

  ngOnInit(): void {
    this.checkViewport();
    this.initActiveItem();
    this.widthChange.emit(this.effectiveWidth);

    this.ngZone.runOutsideAngular(() => {
      document.addEventListener('mousemove', this.onResizeMoveBound);
      document.addEventListener('mouseup', this.onResizeEndBound);
    });
  }

  ngOnDestroy(): void {
    document.removeEventListener('mousemove', this.onResizeMoveBound);
    document.removeEventListener('mouseup', this.onResizeEndBound);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['navItems']) this.initActiveItem();
    if (changes['alternatePanel']) {
      if (this.alternatePanel) {
        this.sidebarWidth = 280;
        this.widthChange.emit(280);
      }
    }
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.checkViewport();
    this.closeAllPopups();
    this.closeFlyout();
    this.widthChange.emit(this.effectiveWidth);
    this.cdr.markForCheck();
  }

  emitSelection(item: NavbarItemCPLModel, items: NavbarItemCPLModel[]) {
    this.itemSelected.emit([item, items]);
  }

  // ─────────────────────────────────────────── Private ─────────────

  private checkViewport(): void {
    this.isMobile = window.innerWidth < 768;
    if (!this.isMobile) this.mobileOpen = false;
  }

  private initActiveItem(): void {
    this.expandedIds.clear();
    const active = this.navItems.find((i) => i.id === this.activeSideBar?.id);
    if (active) {
      this.activeItemId = active.id ?? '';
      this.expandAncestors(active);
    }
  }

  private expandAncestors(item: NavbarItemCPLModel): void {
    if (!item.idmere) return;
    this.expandedIds.add(item.idmere);
    const parent = this.navItems.find((i) => i.id === item.idmere);
    if (parent) this.expandAncestors(parent);
  }

  // ─────────────────────────────────────────── Queries ─────────────

  get level1Items(): NavbarItemCPLModel[] {
    return this.navItems
      .filter((i) => i.niveau === 1)
      .sort((a, b) => a.order - b.order);
  }

  hasChildren(item: NavbarItemCPLModel): boolean {
    return this.navItems.some((i) => i.idmere === item.id);
  }

  getChildren(item: NavbarItemCPLModel): NavbarItemCPLModel[] {
    return this.navItems
      .filter((i) => i.idmere === item.id)
      .sort((a, b) => a.order - b.order);
  }

  isExpanded(id: string): boolean {
    return this.expandedIds.has(id);
  }

  isItemActive(item: NavbarItemCPLModel): boolean {
    if (item.id === this.activeItemId) return true;
    if (item.niveau === 3) {
      const active = this.navItems.find((i) => i.id === this.activeItemId);
      if (active && active.niveau >= 4) return this.isAncestorOf(item, active);
    }
    return false;
  }

  private isAncestorOf(
    ancestor: NavbarItemCPLModel,
    descendant: NavbarItemCPLModel
  ): boolean {
    const seen = new Set<string>();
    let curr: NavbarItemCPLModel | undefined = descendant;
    while (curr?.idmere) {
      if (seen.has(curr.id ?? '')) break;
      seen.add(curr.id ?? '');
      if (curr.idmere === ancestor.id) return true;
      curr = this.navItems.find((i) => i.id === curr!.idmere);
    }
    return false;
  }

  // ─────────────────────────────────────────── Nav clicks ──────────

  onNavItemClick(item: NavbarItemCPLModel): void {
    if (this.hasChildren(item)) {
      const key = item.id ?? item.nom;
      this.expandedIds.has(key) ? this.expandedIds.delete(key) : this.expandedIds.add(key);
    } else {
      this.activeItemId = item.id ?? '';
      this.emitSelection(item, this.getItemParent(item));
      this.closeAllPopups();
      this.closeFlyout();
      if (this.isMobile) this.mobileOpen = false;
    }
    this.cdr.markForCheck();
  }

  openPopupPortal(item: NavbarItemCPLModel, event: MouseEvent): void {
    event.stopPropagation();

    if (!this.hasChildren(item)) {
      this.activeItemId = item.id ?? '';
      this.emitSelection(item, this.getItemParent(item));
      this.closeAllPopups();
      if (this.isMobile) this.mobileOpen = false;
      this.cdr.markForCheck();
      return;
    }

    const trigger = event.currentTarget as HTMLElement;
    const sidebarEl = trigger.closest('.sidebar') as HTMLElement | null;

    let top = 0;
    let left = 260;

    if (sidebarEl) {
      const sidebarRect = sidebarEl.getBoundingClientRect();
      const triggerRect = trigger.getBoundingClientRect();
      top = triggerRect.top - sidebarRect.top;
      left = sidebarRect.width + 6;
    }

    const existingIdx = this.openPopups.findIndex((p) => p.item.id === item.id);
    if (existingIdx !== -1) {
      this.openPopups = this.openPopups.slice(0, existingIdx);
    } else {
      this.openPopups = this.openPopups.filter(
        (p) => (p.item.niveau ?? 0) < (item.niveau ?? 0)
      );
      this.openPopups.push({ item, top, left });
    }

    this.cdr.markForCheck();
  }

  isPopupOpen(itemId: string): boolean {
    return this.openPopups.some((p) => p.item.id === itemId);
  }

  closeAllPopups(): void {
    this.openPopups = [];
  }

  getItemParent(item: NavbarItemCPLModel): NavbarItemCPLModel[] {
    const parts: NavbarItemCPLModel[] = [];
    const seen = new Set<string>();
    let curr: NavbarItemCPLModel | undefined = item;
    while (curr?.idmere) {
      if (seen.has(curr.id ?? '')) break;
      seen.add(curr.id ?? '');
      const parent = this.navItems.find((i) => i.id === curr!.idmere);
      if (parent) { parts.unshift(parent); curr = parent; }
      else break;
    }
    return parts;
  }

  // ─────────── Flyout mode replié (rendu en portail, hors .sidebar-nav) ──
  // L'ancien .icon-flyout vivait DANS .sidebar-nav (overflow-y: auto).
  // Dès qu'un axe d'overflow n'est pas `visible`, le navigateur force
  // l'autre axe à `auto` aussi -> le flyout, en position:absolute,
  // se faisait couper au survol. On le rend donc en frère de
  // .sidebar-nav, exactement comme les popups de niveau ≥ 3.

  onCollapsedItemEnter(item: NavbarItemCPLModel, event: MouseEvent): void {
    this.cancelFlyoutClose();

    const trigger = event.currentTarget as HTMLElement;
    const sidebarEl = trigger.closest('.sidebar') as HTMLElement | null;

    let top = 0;
    let left = this.collapsedWidth + 4;

    if (sidebarEl) {
      const sidebarRect = sidebarEl.getBoundingClientRect();
      const triggerRect = trigger.getBoundingClientRect();
      top = triggerRect.top - sidebarRect.top - 6;
      // Quasi collé au bord (4px) : moins de "zone morte" à traverser
      // au survol entre l'icône et le flyout.
      left = sidebarRect.width + 4;
    }

    this.hoveredFlyout = { item, top, left };
    this.cdr.markForCheck();
  }

  onCollapsedItemLeave(): void {
    this.scheduleFlyoutClose();
  }

  /** Le survol DU flyout lui-même annule la fermeture, pour pouvoir
   *  cliquer sur les sous-éléments sans que le popup ne disparaisse. */
  onFlyoutEnter(): void {
    this.cancelFlyoutClose();
  }

  onFlyoutLeave(): void {
    this.scheduleFlyoutClose();
  }

  isFlyoutOpenFor(itemId: string): boolean {
    return this.hoveredFlyout?.item.id === itemId;
  }

  private scheduleFlyoutClose(): void {
    this.cancelFlyoutClose();
    this.flyoutCloseTimer = setTimeout(() => this.closeFlyout(), this.flyoutCloseDelay);
  }

  private cancelFlyoutClose(): void {
    if (this.flyoutCloseTimer) {
      clearTimeout(this.flyoutCloseTimer);
      this.flyoutCloseTimer = null;
    }
  }

  private closeFlyout(): void {
    this.hoveredFlyout = null;
    this.cdr.markForCheck();
  }

  // ─────────────────────────────────────────── Search ──────────────

  onSearchInput(): void {
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) {
      this.searchResults = [];
      this.showSearchResults = false;
      return;
    }
    this.searchResults = this.navItems
      .filter((i) => this.getMotCle(i).toLowerCase().includes(q))
      .slice(0, 8);
    this.showSearchResults = this.searchResults.length > 0;
  }

  getMotCle(item: NavbarItemCPLModel): string {
    const parts: string[] = [];
    const seen = new Set<string>();
    let curr: NavbarItemCPLModel | undefined = item;
    while (curr?.idmere) {
      if (seen.has(curr.id ?? '')) break;
      seen.add(curr.id ?? '');
      const parent = this.navItems.find((i) => i.id === curr!.idmere);
      if (parent) { parts.unshift(parent.nom); curr = parent; }
      else break;
    }
    return parts.join(' ')+' '+item.nom;
  }

  getItemBreadcrumb(item: NavbarItemCPLModel): string {
    const parts: string[] = [];
    const seen = new Set<string>();
    let curr: NavbarItemCPLModel | undefined = item;
    while (curr?.idmere) {
      if (seen.has(curr.id ?? '')) break;
      seen.add(curr.id ?? '');
      const parent = this.navItems.find((i) => i.id === curr!.idmere);
      if (parent) { parts.unshift(parent.nom); curr = parent; }
      else break;
    }
    return parts.join(' / ');
  }

  selectSearchResult(item: NavbarItemCPLModel): void {
    this.activeItemId = item.id ?? '';
    this.expandAncestors(item);
    this.searchQuery = '';
    this.searchResults = [];
    this.showSearchResults = false;
    this.emitSelection(item, this.getItemParent(item));
    if (this.isMobile) this.mobileOpen = false;
    this.cdr.markForCheck();
  }

  // ─────────────────────────────────────────── Toggles ─────────────

  toggleDesktopCollapse(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
    if (this.sidebarCollapsed) this.showSearchResults = false;
    this.closeAllPopups();
    this.closeFlyout();
    this.widthChange.emit(this.effectiveWidth);
    this.cdr.markForCheck();
  }

  toggleMobileOpen(): void {
    this.mobileOpen = !this.mobileOpen;
    this.cdr.markForCheck();
  }

  toggleUserMenu(): void {
    this.userMenuOpen = !this.userMenuOpen;
    this.cdr.markForCheck();
  }

  getUserInitials(): string {
    return this.user.name
      .split(' ')
      .map((n) => n.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  onButtonClick(button_id:string): void {
    this.onUserButtonClick.emit(button_id);
  }

  // ─────────────────────────────────────────── Resize (bord droit) ─

  private onResizeMoveBound = (event: MouseEvent) => this.onResizeMove(event);
  private onResizeEndBound = () => this.onResizeEnd();

  onResizeStart(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isResizing = true;
    this.resizingChange.emit(true);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    this.cdr.markForCheck();
  }

  private onResizeMove(event: MouseEvent): void {
    if (!this.isResizing) return; // sort AVANT tout appel à Angular, aucun tick() déclenché

    const next = Math.min(this.maxWidth, Math.max(this.minWidth, event.clientX));
    if (next !== this.sidebarWidth) {
      this.sidebarWidth = next;
      // On ne rentre dans la zone Angular QUE quand une vraie mise à jour est nécessaire
      this.ngZone.run(() => {
        this.widthChange.emit(this.effectiveWidth);
        this.cdr.markForCheck();
      });
    }
  }

  private onResizeEnd(): void {
    if (!this.isResizing) return;
    this.isResizing = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    this.ngZone.run(() => {
      this.resizingChange.emit(false);
      this.cdr.markForCheck();
    });
  }

  // ─────────────────────────────────────────── Document click ──────

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.search-wrapper'))     this.showSearchResults = false;
    if (!target.closest('.user-footer-area'))   this.userMenuOpen = false;
    if (
      !target.closest('.nav-item--popup-trigger') &&
      !target.closest('.popup-portal') &&
      !target.closest('.icon-flyout')
    ) {
      this.closeAllPopups();
    }
    this.cdr.markForCheck();
  }
}
