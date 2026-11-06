# Manuel d'utilisation

Un fichier par composant et par module. Chaque page suit le même plan : **à quoi ça sert → démarrage rapide → entrées/sorties (générées depuis le code) → configuration → exemples → accessibilité → pièges**.

> Les tableaux *Entrées / Sorties* sont **générés automatiquement** depuis le code source (`npm run docs:manual`) : ils ne peuvent pas diverger de la réalité.

## Modules

| Module | Page |
|---|---|
| Thème et tokens (`@artis/theme`) | [theme](modules/theme.md) |
| Notifications (`@artis/toaster`) | [toaster](modules/toaster.md) |
| Client API, erreurs, loader (`@artis/api`) | [api](modules/api.md) |
| Session, jetons, guards (`@artis/api`) | [session](modules/session.md) |
| Intercepteurs HTTP (`@artis/api`) | [interceptors](modules/interceptors.md) |
| Textes / i18n (`@artis/ui`) | [i18n](modules/i18n.md) |
| Modale générique (`@artis/ui`) | [modal](modules/modal.md) |
| Types de champ personnalisés (`@artis/ui`) | [field-registry](modules/field-registry.md) |
| Services utilitaires (`@artis/ui`) | [services](modules/services.md) |

## Composants

| Famille | Composant | Page |
|---|---|---|
| **Formulaires** | `art-form-builder` | [form-builder](ui/form-builder.md) |
| | `art-form-field` (tous les types) | [form-field](ui/form-field.md) |
| | `art-color-field` | [color-field](ui/color-field.md) |
| | `art-secret-field` | [secret-field](ui/secret-field.md) |
| | `art-file-field` | [file-field](ui/file-field.md) |
| | `art-form-child` (formulaire tableau) | [form-child](ui/form-child.md) |
| | `[artAttrs]` | [attrs](ui/attrs.md) |
| **Listes** | `art-data-list` (+ mode local/manuel) | [data-list](ui/data-list.md) |
| | `art-dl-table` | [data-list-table](ui/data-list-table.md) |
| | `art-dl-filter` | [data-list-filter](ui/data-list-filter.md) |
| | `art-dl-column-filter` | [data-list-column-filter](ui/data-list-column-filter.md) |
| | `art-dl-sort` | [data-list-sort](ui/data-list-sort.md) |
| | `art-dl-stats` | [data-list-stats](ui/data-list-stats.md) |
| | `art-dl-export-modal` | [data-list-export-modal](ui/data-list-export-modal.md) |
| **Détails** | `art-detail-card` | [detail-card](ui/detail-card.md) |
| | `art-detail-view` | [detail-view](ui/detail-view.md) |
| | `art-tab-view`, `art-tab-view-compact` | [tab-view](ui/tab-view.md) |
| **Layout** | `art-main-layout` | [main-layout](ui/main-layout.md) |
| | `art-header` | [header](ui/header.md) |
| | `art-sidebar` | [sidebar](ui/sidebar.md) |
| | `art-footer` | [footer](ui/footer.md) |
| | `art-loader` | [loader](ui/loader.md) |
| **Transverses** | `art-label` | [label](ui/label.md) |
| | `art-info-tip` | [info-tip](ui/info-tip.md) |
| | `art-markdown-lite` | [markdown-lite](ui/markdown-lite.md) |
| | `art-toast-container` | [toaster](modules/toaster.md) |

Conventions communes (lire une fois) : [00-conventions](00-conventions.md).
