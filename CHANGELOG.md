# Changelog

Format : [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/) · versionnage [SemVer](https://semver.org/lang/fr/) strict.
Les quatre bibliothèques sont versionnées ensemble.

## [1.1.0] — 2026-11-06

### Ajouté
- **Liste (`art-data-list`) — mode local** : `localMode` (ou `isAutoSorted` / `isAutoFiltered` / `isAutoPagination` séparément) : le framework filtre, trie et pagine `data` lui-même. Le mode **manuel** reste disponible (événements `filterApply`, `sortChange`, `pageChange` émis dans tous les modes). `filterFn` pour une logique de filtre personnalisée.
- **Filtre par colonne** (`ColumnDef.filterable`, composant `art-dl-column-filter`), **tri par en-tête** (`ColumnDef.sortable` / `sortKey`, `aria-sort`), **clic sur une valeur pour filtrer** (`ColumnField.filterOnClick`). Filtres synchronisés avec le panneau de filtres et la barre de tri.
- Filtrage local : texte insensible à la casse et aux accents (`filterMatch`), intervalles numériques et de dates (borne max = toute la journée), listes, multi-choix, cellules tableau ; `filterAttribute`.
- **Formulaire tableau (`art-form-child`)** : pied de tableau **parallèle à l'en-tête** — *Supprimer (n)*, *Ajouter N lignes* (défaut 10, `bulkAddCount`), *Ajouter une ligne* ; `maxRows` ; `addRows(n)` ; explications sur les colonnes.
- **Manuel d'utilisation** : une page par composant et par module (`docs/manual/`), tableaux d'entrées/sorties **générés depuis le code** (`npm run docs:manual`).
- `npm run lint:tokens` : contrôle d'intégrité de la DA (primitives inversées en sombre, aucune couleur en dur, tokens existants, variables locales définies).
- `ApiService.buildUrl` : pas de double préfixe quand le chemin commence déjà par `baseUrl`.
- Onglets : navigation clavier WAI-ARIA (`role=tablist/tab/tabpanel`, flèches, Début/Fin, tabindex itinérant).

### Corrigé
- **Thème sombre** : `--c-text` et toutes les variables locales pointant vers une primitive (`--art-neutral-*`, `--art-primary-*`) restaient claires ; les échelles primitives sont désormais **inversées** en sombre et les alias de header/sidebar pointent vers des tokens sémantiques ; deux variables jamais définies (`--c-text` de l'export, `--dc-border` des onglets).
- **Bulles ⓘ** (et sélecteur de couleur, filtre de colonne) : affichées en **couche supérieure** (API Popover) ; elles apparaissaient « au hasard » dans les champs et cartes de stat à cause d'ancêtres avec `transform`/`overflow`.
- **Upload** : double préfixe d'URL (`/api/api/upload` → 404) dans la démo ; message d'erreur d'envoi avec code HTTP.
- `form-child` : les lignes étaient **cochées automatiquement** à la création (le champ ré-émettait sa valeur par défaut) et Angular levait `NG0100` ; valeurs par défaut appliquées avant le rendu ; re-rendu garanti en mode zoneless après un appel programmatique.
- Tri local : valeurs vides toujours en dernier (tri stable), tri « naturel » du texte (item 2 avant item 10), dates et booléens.
- Export CSV/Excel : **injection de formule** neutralisée.
- `[artAttrs]` : attributs `on*`, `srcdoc`, `formaction` et valeurs `javascript:` refusés.
- Titres/textes par défaut anglais ou de marque retirés (header, layout).

## [1.0.0] — 2026-11-03

Première version : refonte de `art-ui-generative` en bibliothèques.

### Ajouté
- **@artis/theme** : 199 tokens CSS (couleurs, typographie, espacements, bordures, ombres, transitions, z-index, layout) dans `@layer art.tokens` ; thèmes `light`, `dark`, `ocean`, `forest` ; `ThemeService` (`set`, `toggle`, `auto`, persistance) ; `provideArtTheme` ; utilitaires de grille/flex (`utilities.css`) ; génération de `docs/TOKENS.md`.
- **@artis/toaster** : `ToastService` (`success/error/warning/info`, actions, durées, file, dédoublonnage, pause survol/focus), `<art-toast-container>`, 6 positions, `provideToaster`.
- **@artis/api** : `ApiService` (verbes, `list`, `upload` avec progression, annulation `signal`/`cancelKey`, variantes Promise), intercepteurs `requestId`, `csrf`, `loader`, `error`, `auth` (refresh single-flight), `SessionService`, stockage de jetons configurable, `authGuard`/`guestGuard`/`roleGuard`, erreurs normalisées (`ApiError`, RFC 7807, codes métier), `escapeHtml`/`sanitizeUrl`, `provideArtApi`.
- **@artis/ui** : champs `color` (sélecteur avancé), `file`, `secret` ; registre de types de champ personnalisés ; explications contextuelles (`art-info-tip`, `art-label`, Markdown restreint) sur tous les libellés ; `ModalService` générique (résultat par `Promise`, imbrication, focus trap) ; textes surchargeables (`ART_UI_TEXTS`).
- Application de démonstration avec faux backend ; guides (démarrage, DA, migration, sécurité, accessibilité).

### Modifié (par rapport à `art-ui-generative`)
- CSS entièrement migrés vers les tokens (couleurs, rayons, ombres, tailles, graisses, durées, z-index, espacements) ; anciennes variables locales conservées comme alias.
- Sélecteurs `app-*` → `art-*` ; classes préfixées `Art` ; `FromBuilderService` → `ArtFormBuilderService`.
- `MainLayout`, `Sidebar`, `Footer`, `Header` génériques (aucune donnée de projet) ; `onStudioMode` → `alternatePanel` + slot `[artSidebarPanel]`.
- `form-field` : `<label for>`, `aria-invalid`/`aria-describedby`, autocomplete via `ApiService` (annulation de la requête précédente).
- Validateurs : un champ optionnel vide n'échoue plus aux validateurs autres que `required`/`custom`.

### Corrigé
- `alert()` de validation du formulaire → toast ; `alert('Validator min…')` de debug supprimé.
- Export PDF : valeurs échappées (XSS) ; couleurs issues des tokens.
- `ResizeObserver` gardé (SSR/tests).
- Dépendance implicite à Bootstrap supprimée ; imports de polices Google retirés des CSS de composants.

### Non inclus / limites connues
- Pages d'authentification et module SIG (spécifiques produit) non repris.
- Virtualisation des listes longues et Storybook non réalisés (voir `docs/CONFORMITE.md`).
- Composants historiques portés : détection de changement `Default` et `@Input()` décorateurs conservés ; couverture de tests < 80 % ; audit WCAG non complet.
