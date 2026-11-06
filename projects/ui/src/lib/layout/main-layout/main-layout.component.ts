import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { SessionService } from '@artis/api';
import { ArtSidebarComponent, SidebarUser } from '../sidebar/sidebar.component';
import { ArtHeaderComponent } from '../header/header.component';
import { ArtFooterComponent, FooterLinkGroup } from '../footer/footer.component';
import { BreadcrumbItem, NotificationItem, ProfileMenuItem } from '../models/header.model';
import { NavbarItemCPLModel } from '../models/navbar-item.model';
import { ArtSidebarService } from '../services/sidebar/sidebar.service';
import { ArtMainLayoutService } from '../services/main-layout.service';

/**
 * Gabarit applicatif : sidebar + header + zone de contenu (`<router-outlet>`) + footer.
 * Entièrement piloté par des entrées : aucune donnée ni logique métier.
 *
 * ```html
 * <art-main-layout [menuItems]="menu" [user]="user" brandName="Mon app" (profileAction)="onProfile($event)" />
 * ```
 * Contenu projeté : `[artSidebarPanel]` remplace la navigation quand `alternatePanel` est vrai.
 */
@Component({
  selector: 'art-main-layout',
  standalone: true,
  imports: [RouterOutlet, ArtSidebarComponent, ArtHeaderComponent, ArtFooterComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.css',
})
export class ArtMainLayoutComponent implements OnChanges {
  private readonly layoutService = inject(ArtMainLayoutService);
  private readonly sidebarService = inject(ArtSidebarService);
  private readonly session = inject(SessionService);
  private readonly router = inject(Router);

  /** Entrées de navigation (arbre). Si absent et `menusEndpoint` fourni, elles sont chargées via l'API. */
  @Input() menuItems: NavbarItemCPLModel[] = [];
  /** Endpoint de chargement des menus (optionnel). */
  @Input() menusEndpoint?: string;
  @Input() user: SidebarUser & { role?: string } = { name: '', email: '' };
  @Input() notifications: NotificationItem[] = [];
  @Input() profileMenuItems: ProfileMenuItem[] = [
    { id: 'logout', label: 'Se déconnecter', icon: 'logout', isDanger: true },
  ];
  @Input() brandName = '';
  @Input() logoUrl = '';
  @Input() searchPlaceholder = 'Rechercher…';
  @Input() footerLinkGroups: FooterLinkGroup[] = [];
  @Input() showFooter = true;
  /** Remplace la navigation par le contenu `[artSidebarPanel]`. */
  @Input() alternatePanel = false;
  /** Titre de page ; par défaut `MainLayoutService.pageTitle`. */
  @Input() pageTitle?: string;
  /** Si vrai (défaut), l'action de profil `logout` déconnecte via `SessionService`. */
  @Input() autoLogout = true;

  @Output() itemSelected = new EventEmitter<NavbarItemCPLModel>();
  @Output() profileAction = new EventEmitter<ProfileMenuItem>();
  @Output() logout = new EventEmitter<void>();
  @Output() search = new EventEmitter<string>();
  @Output() notificationRead = new EventEmitter<string>();
  @Output() help = new EventEmitter<void>();
  @Output() breadcrumbClick = new EventEmitter<BreadcrumbItem>();

  protected readonly breadcrumbs = signal<BreadcrumbItem[]>([]);
  protected readonly loadedItems = signal<NavbarItemCPLModel[]>([]);
  protected sidebarWidthPx = 240;
  protected isSidebarResizing = false;

  protected get title(): string { return this.pageTitle ?? this.layoutService.getPageTitle(); }
  protected get items(): NavbarItemCPLModel[] { return this.menuItems.length ? this.menuItems : this.loadedItems(); }
  protected get activeSideBar(): NavbarItemCPLModel | undefined { return this.sidebarService.getActiveSideBar(); }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['menusEndpoint'] && this.menusEndpoint && !this.menuItems.length) void this.loadMenus();
  }

  ngOnInit(): void {
    this.setBreadcrumbs(this.sidebarService.getBreadCumbs());
  }

  private async loadMenus(): Promise<void> {
    const res = await this.sidebarService.getAll(this.menusEndpoint);
    if (res) this.loadedItems.set(res as NavbarItemCPLModel[]);
  }

  private setBreadcrumbs(items: NavbarItemCPLModel[]): void {
    this.breadcrumbs.set(items.map((i) => ({ label: i.nom, route: i.route, icon: i.icon })));
  }

  protected onItemSelected([item, path]: [NavbarItemCPLModel, NavbarItemCPLModel[]]): void {
    const trail = [...path, item];
    this.setBreadcrumbs(trail);
    this.sidebarService.updateActualSideBar(item, trail);
    this.itemSelected.emit(item);
    if (item.route) void this.router.navigate([item.route]);
  }

  protected onUserButton(id: string): void {
    this.handleAction({ id, label: id, icon: '' });
  }

  protected onProfile(item: ProfileMenuItem): void {
    this.handleAction(item);
  }

  private handleAction(item: ProfileMenuItem): void {
    this.profileAction.emit(item);
    if (item.id === 'logout') {
      this.logout.emit();
      if (this.autoLogout) this.session.logout();
    } else if (item.route) {
      void this.router.navigate([item.route]);
    }
  }

  protected onSidebarWidth(w: number): void { this.sidebarWidthPx = w; }
  protected onResizing(r: boolean): void { this.isSidebarResizing = r; }
}
