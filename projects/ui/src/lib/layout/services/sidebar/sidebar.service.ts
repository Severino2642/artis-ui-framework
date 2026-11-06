import { Injectable, InjectionToken, inject } from '@angular/core';
import { ApiService } from '@artis/api';
import { NavbarItemModel } from '../../models/navbar-item.model';

export interface ArtSidebarConfig {
  /** Endpoint listant les menus (relatif à `baseUrl` de @artis/api). Défaut : `/menus`. */
  menusEndpoint: string;
  /** Clés de persistance de l'élément actif et du fil d'Ariane. */
  activeKey: string;
  breadcrumbKey: string;
  /** Stockage utilisé pour mémoriser la navigation. Défaut : sessionStorage. */
  storage: 'localStorage' | 'sessionStorage' | 'none';
}

export const ART_SIDEBAR_CONFIG = new InjectionToken<ArtSidebarConfig>('ART_SIDEBAR_CONFIG', {
  providedIn: 'root',
  factory: () => ({
    menusEndpoint: '/menus',
    activeKey: 'art.sidebar.active',
    breadcrumbKey: 'art.sidebar.breadcrumb',
    storage: 'sessionStorage',
  }),
});

/** Chargement des menus et mémorisation de la navigation courante. Aucun endpoint codé en dur : configurez `ART_SIDEBAR_CONFIG`. */
@Injectable({ providedIn: 'root' })
export class ArtSidebarService {
  private readonly api = inject(ApiService);
  readonly config = inject(ART_SIDEBAR_CONFIG);

  getById(id: string | number): Promise<NavbarItemModel | null> {
    return this.api.getAsync<NavbarItemModel>(`${this.config.menusEndpoint}/${id}`);
  }

  getAll(endpoint: string = this.config.menusEndpoint): Promise<NavbarItemModel[] | null> {
    return this.api.getAsync<NavbarItemModel[]>(endpoint);
  }

  getActiveSideBar(): NavbarItemModel | undefined {
    return this.read<NavbarItemModel>(this.config.activeKey) ?? undefined;
  }

  getBreadCumbs(): NavbarItemModel[] {
    return this.read<NavbarItemModel[]>(this.config.breadcrumbKey) ?? [];
  }

  updateActualSideBar(activeSideBar: NavbarItemModel, breadCumbs: NavbarItemModel[]): void {
    this.write(this.config.activeKey, activeSideBar);
    this.write(this.config.breadcrumbKey, breadCumbs);
  }

  private get area(): Storage | null {
    if (this.config.storage === 'none') return null;
    try { return typeof window !== 'undefined' ? window[this.config.storage] : null; } catch { return null; }
  }

  private read<T>(key: string): T | null {
    try {
      const raw = this.area?.getItem(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch { return null; }
  }

  private write(key: string, value: unknown): void {
    try { this.area?.setItem(key, JSON.stringify(value)); } catch { /* stockage indisponible */ }
  }
}
