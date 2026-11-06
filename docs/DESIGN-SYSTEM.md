# Direction Artistique : un seul fichier de tokens

## Principe

* **Source unique** : `@artis/theme/styles/tokens.css` (199 variables `--art-*`, documentées dans [TOKENS.md](TOKENS.md)).
* Les composants **ne consomment que ces tokens** (couleurs, rayons, ombres, espacements, tailles de police, graisses, durées, z-index).
* Les tokens par défaut sont dans `@layer art.tokens`. **Tout CSS non layerisé du projet l'emporte**, quelle que soit sa spécificité ou son ordre : pas de `!important`, pas de surcharge de composants.

## Deux niveaux de tokens

| Niveau | Exemples | Quand les modifier |
|---|---|---|
| **Primitifs** (palettes) | `--art-primary-50…900`, `--art-neutral-50…900`, `--art-danger-600` | Changer la marque : redéfinir l'échelle primaire |
| **Sémantiques** (ce que lisent les composants) | `--art-bg`, `--art-surface`, `--art-text`, `--art-border`, `--art-primary`, `--art-danger-soft` | Ajuster un usage précis (ex. fond des cartes) ; **c'est ce que fait le thème sombre** |

Catégories : couleurs (primaire, secondaire, accent, succès, danger, warning, info, neutres 50→900, sémantiques) · typographie (familles, 10 tailles, 5 graisses, hauteurs de ligne) · espacements (`xs 4px … 4xl 64px` + pas fins) · bordures (7 rayons, épaisseurs) · ombres (`xs sm md lg popup` + focus) · transitions (3 durées, 4 courbes) · z-index (échelle centralisée) · layout.

## Personnaliser un projet

1. Créer `src/mon-theme.css`, chargé **après** `@artis/theme` dans `angular.json`.
2. Y redéfinir uniquement ce qui change :

```css
:root {
  /* marque : l'échelle primaire suffit, tous les états en découlent */
  --art-primary-50:  #f5f3ff;  --art-primary-100: #ede9fe;  --art-primary-200: #ddd6fe;
  --art-primary-500: #8b5cf6;  --art-primary-600: #7c3aed;  --art-primary-700: #6d28d9;

  --art-font-sans: 'Inter', system-ui, sans-serif;
  --art-radius-md: 4px;                 /* angles plus nets partout */
  --art-shadow-popup: 0 10px 30px rgb(0 0 0 / .2);
}
```

Aucun fichier du framework n'est touché. Mettre à jour le framework n'écrase pas votre DA.

## Thèmes prêts à l'emploi

| `data-theme` | Démontre |
|---|---|
| `light` (défaut) | DA d'origine (orange, neutres chauds) |
| `dark` | Inversion de **tous** les tokens sémantiques, teintes douces recalculées par `color-mix` |
| `ocean` | Autre marque : primaire turquoise, neutres froids, police Inter, angles nets |
| `forest` | Autre marque : primaire vert, neutres verdâtres, police serif, angles très arrondis |

```ts
inject(ThemeService).set('dark');   // ou 'auto' (suit prefers-color-scheme), toggle(), isDark()
```

Créer **son** thème nommé : copier `themes/ocean.css`, changer `[data-theme='ocean']` en `[data-theme='ma-marque']`, puis `provideArtTheme({ themes: ['light','ma-marque'] })`.

## Règles pour écrire un composant conforme

* Couleur → `var(--art-…)` sémantique (jamais `#hex`, `rgb()` ni nom de couleur).
* Transparence → `color-mix(in srgb, var(--art-primary) 12%, transparent)`.
* Espacement → `var(--art-space-*)` ; rayon → `var(--art-radius-*)` ; ombre → `var(--art-shadow-*)`.
* Durée/courbe → `var(--art-duration-*)` / `var(--art-easing-*)` (respecte `prefers-reduced-motion`).
* Empilement → `var(--art-z-*)`.

## Exceptions documentées (non thémables par nature)

* Le **spectre de teinte** (0–360°) du sélecteur de couleur.
* La **fenêtre d'impression PDF** (document séparé) : elle recopie les valeurs *résolues* des tokens du thème actif au moment de l'export.
* Dimensions fonctionnelles non liées à la DA (largeur d'une icône, hauteur d'une zone de sélection, positions) : restent en `px`.
* Écarts de normalisation de la migration : les valeurs d'origine ont été arrondies à l'échelle de tokens (±1 px sur certains espacements, rayons et tailles de police).

## Variables locales héritées

Les variables propres aux composants d'origine (`--fb-*`, `--ff-*`, `--fc-*`, `--dc-*`, `--tv-*`, `--footer-*`, `--sidebar-*`, `--c-*`, `--shadow-*`…) existent toujours mais **sont maintenant des alias vers les tokens** (`--fb-primary: var(--art-primary)`). Les surcharger par instance reste possible ; préférez les tokens `--art-*`.
