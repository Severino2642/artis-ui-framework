# `art-footer` — pied de page

## À quoi ça sert
Pied de page avec marque, groupes de liens, liens légaux, réseaux sociaux et copyright. Deux variantes : `full` (colonnes) et `minimal` (une ligne). **Vide par défaut** : tout le contenu vient de vos entrées.

**Sélecteur** `art-footer` · **Import** `ArtFooterComponent`

## Démarrage rapide
```html
<art-footer variant="full" companyName="Acme" tagline="Simplifiez vos ventes."
            [linkGroups]="[{ title: 'Produit', links: [{ label: 'Documentation', href: '/docs' }, { label: 'Tarifs', href: '/pricing' }] }]"
            [legalLinks]="[{ label: 'Mentions légales', href: '/legal' }]" />
```

<!-- API:art-footer -->
Source : `ui/src/lib/layout/footer/footer.component.ts`
**Entrées**

| Nom | Type | Défaut | Rôle |
|---|---|---|---|
| `companyName` | `any` | `''` | — |
| `tagline` | `any` | `''` | — |
| `logoUrl` | `string` | — | — |
| `linkGroups` | `FooterLinkGroup[]` | `[]` | — |
| `legalLinks` | `FooterLink[]` | `[]` | — |
| `socialLinks` | `FooterSocialLink[]` | `[]` | Vide par défaut → section masquée automatiquement. |
| `variant` | `FooterVariant` | `'full'` | — |
| `offsetForSidebar` | `any` | `false` | Aligne le footer avec une sidebar externe via --footer-sidebar-offset. |
| `showDivider` | `any` | `true` | Affiche le séparateur horizontal entre le bloc principal et la barre légale. |
| `year` | `number` | `new Date().getFullYear()` | Année affichée dans le copyright — figée à l'instanciation, jamais recalculée via getter à chaque cycle de détection de changement. |
| `theme` | `FooterTheme` | `{}` | — |
<!-- /API -->

## Modèles
| Modèle | Champs |
|---|---|
| `FooterLinkGroup` | `{ title, links: FooterLink[] }` |
| `FooterLink` | `{ label, href?, routerLink?, external? }` — `routerLink` pour une route Angular, `href` pour une URL ; `external: true` ouvre dans un nouvel onglet |
| `FooterSocialLink` | `{ label, href, iconPath }` — `iconPath` = données d'un tracé SVG (`<path d="…">`, viewBox 0 0 24 24) |
| `FooterVariant` | `'full'` (colonnes) \| `'minimal'` (une ligne) |
| `FooterTheme` | Surcharges CSS **par instance** : `bg`, `border`, `text`, `textSecondary`, `textTertiary`, `primary`, `accent`, `hover`, `radiusSm`, `radiusMd`, `shadow`, `duration`, `easing`, `font`, `maxWidth`, `paddingX`, `paddingY`, `sidebarOffset`. Valeurs CSS libres : privilégiez des `var(--art-…)` ; pour un changement global, modifiez les tokens |

## Accessibilité
Liens avec libellé explicite ; liens externes : indiquez `external` (ouverture sécurisée).

## Pièges
* Sans `companyName`, aucune marque n'est affichée.
