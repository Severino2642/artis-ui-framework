import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  AfterViewInit,
  SimpleChanges,
  HostListener,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  BreadcrumbItem,
  HeaderUser,
  NotificationCategory,
  NotificationItem,
  ProfileMenuItem
} from '../models/header.model';

@Component({
  selector: 'art-header',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArtHeaderComponent implements OnInit, OnChanges, AfterViewInit {

  // ── Inputs ────────────────────────────────────────────────────
  /** Titre principal de la page courante */
  @Input() pageTitle = '';

  /** Fil d'Ariane complet */
  @Input() breadcrumbs: BreadcrumbItem[] = [];

  /** Liste complète des notifications */
  @Input() notifications: NotificationItem[] = [];

  /** Données de l'utilisateur connecté */
  @Input() user: HeaderUser = { name: '', email: '' };

  /** Menu du profil */
  @Input() profileMenuItems: ProfileMenuItem[] = [];

  /** Placeholder de la barre de recherche */
  @Input() searchPlaceholder = 'Rechercher…';

  /** Valeur courante de la recherche (two-way si besoin) */
  @Input() searchValue = '';

  /** Largeur du sidebar (pour le décalage margin-left) */
  @Input() sidebarWidth = 260;

  /** Sidebar réduit en mode icônes */
  @Input() sidebarCollapsed = false;

  // ── Outputs ────────────────────────────────────────────────────
  @Output() searchChange     = new EventEmitter<string>();
  @Output() searchSubmit     = new EventEmitter<string>();
  @Output() notificationRead = new EventEmitter<string>();       // id notif
  @Output() notificationsClear = new EventEmitter<void>();
  @Output() profileAction    = new EventEmitter<ProfileMenuItem>();
  @Output() breadcrumbClick  = new EventEmitter<BreadcrumbItem>();
  @Output() helpClick        = new EventEmitter<void>();

  // ── UI state ───────────────────────────────────────────────────
  isMobile = false;
  showNotifDropdown = false;
  showProfileDropdown = false;
  showTitleDropdown = false;
  isTitleOverflowing = false;
  notifTab: NotificationCategory = 'today';

  @ViewChild('mobileTrack')  mobileTrack!:  ElementRef<HTMLElement>;
  @ViewChild('mobileText')   mobileText!:   ElementRef<HTMLElement>;
  @ViewChild('desktopTrack') desktopTrack!: ElementRef<HTMLElement>;
  @ViewChild('desktopText')  desktopText!:  ElementRef<HTMLElement>;

  // ── Computed breadcrumbs ───────────────────────────────────────
  visibleCrumbs: BreadcrumbItem[] = [];
  hiddenCrumbs: BreadcrumbItem[] = [];
  showHiddenCrumbs = false;

  /** Seuil : afficher first + ... + last 2 si longueur > MAX */
  private readonly BREADCRUMB_MAX = 4;

  constructor(private cdr: ChangeDetectorRef) {}

  // ─────────────────────────────────────────── Lifecycle ──────────

  ngOnInit(): void {
    this.checkViewport();
    this.computeBreadcrumbs();
  }

  ngAfterViewInit(): void {
    // Délai pour laisser le DOM se stabiliser
    setTimeout(() => this.checkTitleOverflow(), 100);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['breadcrumbs']) this.computeBreadcrumbs();
    if (changes['pageTitle']) {
      setTimeout(() => this.checkTitleOverflow(), 50);
    }
  }

  @HostListener('window:resize')
  onResize(): void {
    this.checkViewport();
    setTimeout(() => this.checkTitleOverflow(), 50);
    this.cdr.markForCheck();
  }

  // ─────────────────────────────────────────── Private ───────────

  private checkViewport(): void {
    this.isMobile = window.innerWidth < 768;
  }

  private checkTitleOverflow(): void {
    // On mesure uniquement le premier span de texte vs son conteneur (track)
    let textEl: HTMLElement | null = null;
    let trackEl: HTMLElement | null = null;

    if (this.isMobile) {
      textEl  = this.mobileText?.nativeElement  ?? null;
      trackEl = this.mobileTrack?.nativeElement ?? null;
    } else {
      textEl  = this.desktopText?.nativeElement  ?? null;
      trackEl = this.desktopTrack?.nativeElement ?? null;
    }

    if (!textEl || !trackEl) {
      // Fallback querySelector si ViewChild pas encore résolu
      textEl  = document.querySelector<HTMLElement>('.title-marquee-text, .page-title-marquee-text');
      trackEl = textEl?.closest('.title-scroll-track, .page-title-wrapper') ?? null;
    }

    if (!textEl || !trackEl) { this.isTitleOverflowing = false; return; }

    const overflow = textEl.scrollWidth > trackEl.clientWidth;
    if (overflow !== this.isTitleOverflowing) {
      this.isTitleOverflowing = overflow;
      this.cdr.markForCheck();
    }
  }

  private computeBreadcrumbs(): void {
    const crumbs = this.breadcrumbs;
    if (crumbs.length <= this.BREADCRUMB_MAX) {
      this.visibleCrumbs = crumbs;
      this.hiddenCrumbs  = [];
    } else {
      // Afficher: [0] … [n-2] [n-1]
      this.visibleCrumbs = [crumbs[0], ...crumbs.slice(-2)];
      this.hiddenCrumbs  = crumbs.slice(1, -2);
    }
  }

  // ─────────────────────────────────────────── Breadcrumbs ───────


  isEllipsis(index: number): boolean {
    return this.hiddenCrumbs.length > 0 && index === 1;
  }

  onBreadcrumbClick(crumb: BreadcrumbItem): void {
    if (crumb.route) this.breadcrumbClick.emit(crumb);
  }

  toggleTitleDropdown(event: MouseEvent): void {
    event.stopPropagation();
    this.showTitleDropdown = !this.showTitleDropdown;
    this.cdr.markForCheck();
  }

  // ─────────────────────────────────────────── Notifications ─────

  get notifsByTab(): NotificationItem[] {
    return this.notifications.filter((n) => n.category === this.notifTab);
  }

  get unreadCount(): number {
    return this.notifications.filter((n) => !n.isRead).length;
  }

  get unreadCountDisplay(): string {
    const c = this.unreadCount;
    return c > 99 ? '99+' : String(c);
  }

  toggleNotif(event: MouseEvent): void {
    event.stopPropagation();
    this.showNotifDropdown = !this.showNotifDropdown;
    if (this.showNotifDropdown) this.showProfileDropdown = false;
    this.cdr.markForCheck();
  }

  setNotifTab(tab: NotificationCategory): void {
    this.notifTab = tab;
    this.cdr.markForCheck();
  }

  markRead(notif: NotificationItem, event: MouseEvent): void {
    event.stopPropagation();
    notif.isRead = true;
    this.notificationRead.emit(notif.id);
    this.cdr.markForCheck();
  }

  markAllRead(): void {
    this.notifications.forEach((n) => (n.isRead = true));
    this.notificationsClear.emit();
    this.cdr.markForCheck();
  }

  getSeverityColor(severity: string): string {
    const map: Record<string, string> = {
      info:    'var(--art-info)',
      success: 'var(--art-success)',
      warning: 'var(--art-warning)',
      error:   'var(--art-danger)',
    };
    return map[severity] ?? 'var(--art-info)';
  }

  // ─────────────────────────────────────────── Profile ───────────

  toggleProfile(event: MouseEvent): void {
    event.stopPropagation();
    this.showProfileDropdown = !this.showProfileDropdown;
    if (this.showProfileDropdown) this.showNotifDropdown = false;
    this.cdr.markForCheck();
  }

  onProfileMenuClick(item: ProfileMenuItem): void {
    this.profileAction.emit(item);
    this.showProfileDropdown = false;
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

  // ─────────────────────────────────────────── Search ────────────

  onSearchInput(value: string): void {
    this.searchValue = value;
    this.searchChange.emit(value);
  }

  onSearchKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') this.searchSubmit.emit(this.searchValue);
  }

  // ─────────────────────────────────────────── Document click ────

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.notif-wrapper'))            this.showNotifDropdown   = false;
    if (!target.closest('.profile-wrapper'))          this.showProfileDropdown = false;
    if (!target.closest('.title-breadcrumb-wrapper')) this.showTitleDropdown   = false;
    this.cdr.markForCheck();
  }

  // ─────────────────────────────────────────── Computed styles ───

  get headerMarginLeft(): number {
    if (this.isMobile) return 0;
    return this.sidebarCollapsed ? 68 : this.sidebarWidth;
  }
}
