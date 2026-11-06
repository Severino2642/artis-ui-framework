import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

export interface FooterLink {
  label: string;
  href?: string;
  routerLink?: string;
  external?: boolean;
}

export interface FooterLinkGroup {
  title: string;
  links: FooterLink[];
}

export interface FooterSocialLink {
  label: string;
  href: string;
  /** SVG path data (single <path d="..."/>), viewBox 0 0 24 24 */
  iconPath: string;
}

/**
 * Surcharge des variables CSS locales du composant (préfixe --footer-*).
 * Toutes les clés sont optionnelles : seules celles fournies sont
 * appliquées, le reste garde la valeur par défaut définie sur :host.
 * Voir la liste complète des variables dans footer.component.css.
 */
export interface FooterTheme {
  bg?: string;
  border?: string;
  text?: string;
  textSecondary?: string;
  textTertiary?: string;
  primary?: string;
  accent?: string;
  hover?: string;
  radiusSm?: string;
  radiusMd?: string;
  shadow?: string;
  duration?: string;
  easing?: string;
  font?: string;
  maxWidth?: string;
  paddingX?: string;
  paddingY?: string;
  sidebarOffset?: string;
}

/** Contrôle les sections affichées, pour réutiliser le composant
 *  dans des contextes différents (page marketing vs app interne). */
export type FooterVariant = 'full' | 'minimal';

const THEME_KEY_TO_CSS_VAR: Record<keyof FooterTheme, string> = {
  bg: '--footer-bg',
  border: '--footer-border',
  text: '--footer-text',
  textSecondary: '--footer-text-2',
  textTertiary: '--footer-text-3',
  primary: '--footer-primary',
  accent: '--footer-accent',
  hover: '--footer-hover',
  radiusSm: '--footer-radius-sm',
  radiusMd: '--footer-radius-md',
  shadow: '--footer-shadow',
  duration: '--footer-duration',
  easing: '--footer-easing',
  font: '--footer-font',
  maxWidth: '--footer-max-width',
  paddingX: '--footer-padding-x',
  paddingY: '--footer-padding-y',
  sidebarOffset: '--footer-sidebar-offset',
};

@Component({
  selector: 'art-footer',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArtFooterComponent implements OnChanges {
  // ── Contenu ──────────────────────────────────────────────────────
  @Input() companyName = '';
  @Input() tagline = '';
  @Input() logoUrl?: string;

  @Input() linkGroups: FooterLinkGroup[] = [];

  @Input() legalLinks: FooterLink[] = [];

  /** Vide par défaut → section masquée automatiquement. */
  @Input() socialLinks: FooterSocialLink[] = [];

  // ── Comportement / layout ──────────────────────────────────────
  /** 'full' = logo + colonnes + barre légale. 'minimal' = juste la barre du bas. */
  @Input() variant: FooterVariant = 'full';

  /** Aligne le footer avec une sidebar externe via --footer-sidebar-offset. */
  @Input() offsetForSidebar = false;

  /** Affiche le séparateur horizontal entre le bloc principal et la barre légale. */
  @Input() showDivider = true;

  /** Année affichée dans le copyright — figée à l'instanciation, jamais
   *  recalculée via getter à chaque cycle de détection de changement. */
  @Input() year: number = new Date().getFullYear();

  // ── Personnalisation visuelle ────────────────────────────────────
  /** Surcharge ponctuelle des variables CSS locales du composant. */
  @Input() theme: FooterTheme = {};

  /** Object appliqué en [ngStyle] sur le hôte — construit une seule fois
   *  par changement réel de `theme`, pas à chaque détection de changement. */
  hostStyle: Record<string, string> = {};

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['theme']) {
      this.hostStyle = this.buildHostStyle(this.theme);
    }
  }

  private buildHostStyle(theme: FooterTheme): Record<string, string> {
    const style: Record<string, string> = {};
    (Object.keys(theme) as (keyof FooterTheme)[]).forEach((key) => {
      const value = theme[key];
      const cssVar = THEME_KEY_TO_CSS_VAR[key];
      if (value != null && cssVar) style[cssVar] = value;
    });
    return style;
  }

  trackByGroupTitle(index: number, group: FooterLinkGroup): string {
    return group.title;
  }

  trackByLinkLabel(index: number, link: FooterLink): string {
    return link.label;
  }

  trackBySocialLabel(index: number, social: FooterSocialLink): string {
    return social.label;
  }
}
