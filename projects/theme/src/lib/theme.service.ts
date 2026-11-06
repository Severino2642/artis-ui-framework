import { DOCUMENT } from '@angular/common';
import {
  DestroyRef,
  EnvironmentProviders,
  Injectable,
  InjectionToken,
  PLATFORM_ID,
  computed,
  effect,
  inject,
  makeEnvironmentProviders,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/** Nom de thème. `auto` suit la préférence système (clair/sombre). */
export type ArtThemeName = 'light' | 'dark' | 'ocean' | 'forest' | 'auto' | (string & {});

export interface ArtThemeConfig {
  /** Thème appliqué au démarrage si rien n'est mémorisé. Défaut : `light`. */
  defaultTheme?: ArtThemeName;
  /** Thèmes proposés par `ThemeService.available`. Défaut : light, dark, ocean, forest. */
  themes?: ArtThemeName[];
  /** Clé de stockage du choix utilisateur ; `null` désactive la persistance. Défaut : `art-theme`. */
  storageKey?: string | null;
  /** Attribut posé sur l'élément racine. Défaut : `data-theme`. */
  attribute?: string;
}

export const ART_THEME_CONFIG = new InjectionToken<ArtThemeConfig>('ART_THEME_CONFIG', {
  providedIn: 'root',
  factory: () => ({}),
});

/** Configure le thème : `provideArtTheme({ defaultTheme: 'ocean' })`. */
export function provideArtTheme(config: ArtThemeConfig = {}): EnvironmentProviders {
  return makeEnvironmentProviders([{ provide: ART_THEME_CONFIG, useValue: config }]);
}

const DEFAULT_THEMES: ArtThemeName[] = ['light', 'dark', 'ocean', 'forest'];

/**
 * Applique un thème en posant `data-theme` sur `<html>`.
 * Le thème « auto » suit `prefers-color-scheme` en temps réel.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly doc = inject(DOCUMENT);
  private readonly cfg = inject(ART_THEME_CONFIG);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private readonly attribute = this.cfg.attribute ?? 'data-theme';
  private readonly storageKey = this.cfg.storageKey === undefined ? 'art-theme' : this.cfg.storageKey;

  /** Thèmes sélectionnables. */
  readonly available: readonly ArtThemeName[] = this.cfg.themes ?? DEFAULT_THEMES;

  private readonly _theme = signal<ArtThemeName>(this.readInitial());
  private readonly _systemDark = signal(this.systemPrefersDark());

  /** Choix courant (peut valoir `auto`). */
  readonly theme = this._theme.asReadonly();
  /** Thème réellement appliqué (jamais `auto`). */
  readonly resolved = computed<ArtThemeName>(() => {
    const t = this._theme();
    return t === 'auto' ? (this._systemDark() ? 'dark' : 'light') : t;
  });
  /** Vrai si le thème appliqué est sombre. */
  readonly isDark = computed(() => this.resolved() === 'dark');

  constructor() {
    effect(() => this.doc.documentElement.setAttribute(this.attribute, this.resolved()));

    if (this.isBrowser && typeof matchMedia === 'function') {
      const mq = matchMedia('(prefers-color-scheme: dark)');
      const onChange = (e: MediaQueryListEvent) => this._systemDark.set(e.matches);
      mq.addEventListener?.('change', onChange);
      inject(DestroyRef).onDestroy(() => mq.removeEventListener?.('change', onChange));
    }
  }

  /** Change de thème et le mémorise. */
  set(name: ArtThemeName): void {
    this._theme.set(name);
    this.persist(name);
  }

  /** Bascule clair ↔ sombre (depuis n'importe quel autre thème, passe en sombre). */
  toggle(): void {
    this.set(this.resolved() === 'dark' ? 'light' : 'dark');
  }

  private readInitial(): ArtThemeName {
    const fallback = this.cfg.defaultTheme ?? 'light';
    if (!this.isBrowser || !this.storageKey) return fallback;
    try {
      return (localStorage.getItem(this.storageKey) as ArtThemeName | null) ?? fallback;
    } catch {
      return fallback;
    }
  }

  private persist(name: ArtThemeName): void {
    if (!this.isBrowser || !this.storageKey) return;
    try {
      localStorage.setItem(this.storageKey, name);
    } catch {
      /* stockage indisponible (mode privé) : on ignore. */
    }
  }

  private systemPrefersDark(): boolean {
    return this.isBrowser && typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches;
  }
}
