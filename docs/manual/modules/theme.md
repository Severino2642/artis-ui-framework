# Thème et tokens — `@artis/theme`

## À quoi ça sert
Définir **toute** la direction artistique (couleurs, typographie, espacements, rayons, ombres, transitions, z-index) à un seul endroit, et la changer sans toucher aux composants. Fournit aussi quatre thèmes et un service pour les basculer.

## Installation
```json
// angular.json → build → styles
"styles": ["node_modules/@artis/theme/styles/index.css", "src/mon-theme.css", "src/styles.css"]
```
`index.css` charge : `tokens.css`, `themes/*.css`, `base.css` (focus visible, `.art-sr-only`, `prefers-reduced-motion`), `utilities.css` (grille 12 colonnes et utilitaires flex).

## Démarrage rapide
```ts
// app.config.ts
provideArtTheme({ defaultTheme: 'light', storageKey: 'art-theme' })
```
```ts
// n'importe où
const theme = inject(ThemeService);
theme.set('dark');        // 'light' | 'dark' | 'ocean' | 'forest' | 'auto' | votre thème
theme.toggle();           // clair ⇄ sombre
theme.isDark();           // signal booléen
theme.resolved();         // thème réellement appliqué (jamais 'auto')
theme.available;          // liste des thèmes proposés
```

## `ArtThemeConfig`
| Option | Défaut | Rôle |
|---|---|---|
| `defaultTheme` | `'light'` | Thème au premier démarrage |
| `themes` | `['light','dark','ocean','forest']` | Thèmes proposés par `available` |
| `storageKey` | `'art-theme'` | Clé de mémorisation (`null` = pas de persistance) |
| `attribute` | `'data-theme'` | Attribut posé sur `<html>` |

`auto` suit `prefers-color-scheme` **en temps réel**.

## Personnaliser la DA d'un projet
Créez `src/mon-theme.css`, chargé **après** le framework, et redéfinissez seulement ce qui change :

```css
:root {
  --art-primary-600: #7c3aed;   --art-primary-700: #6d28d9;   /* marque */
  --art-font-sans: 'Inter', system-ui, sans-serif;
  --art-radius-md: 4px;
}
```
Les tokens du framework sont dans `@layer art.tokens` : votre CSS non layerisé gagne **toujours**, sans `!important`.

## Deux niveaux de tokens
* **Primitifs** : `--art-primary-50…900`, `--art-neutral-50…900`, `--art-danger-600`… (les palettes).
* **Sémantiques** : `--art-text`, `--art-surface`, `--art-border`, `--art-primary`, `--art-danger-soft`… (ce que lisent les composants).

Le **thème sombre** redéfinit les sémantiques **et inverse les échelles primitives** neutres et primaires : même un composant qui référence directement `--art-neutral-900` pour du texte devient clair en sombre.

## Créer un thème nommé
Copiez `themes/ocean.css`, remplacez le sélecteur par `[data-theme='ma-marque']`, importez le fichier, puis `provideArtTheme({ themes: ['light', 'ma-marque'] })`.

## Utilitaires de layout (`utilities.css`)
Grille et flex compatibles Bootstrap, **sans Bootstrap** : `row`, `g-1…5`, `gx-*`, `gy-*`, `gap-1…5`, `col`, `col-auto`, `col-1…12`, `col-sm-*`, `col-md-*`, `d-flex`, `d-none`, `d-block`, `d-grid`, `d-md-flex`, `flex-column`, `flex-wrap`, `flex-grow-1`, `flex-shrink-0`, `align-items-*`, `justify-content-*`, `position-relative`, `min-w-0`, `w-100`, `mb-0`, `mt-0`, `pt-0`, `border`. Breakpoints : `sm` ≥ 576 px, `md` ≥ 768 px.

## Contrôle automatique
`npm run lint:tokens` vérifie : primitives inversées en sombre, aucune couleur codée en dur, tokens référencés existants, aucune variable locale non définie.

## Référence
Tous les tokens : [../../TOKENS.md](../../TOKENS.md) · Guide : [../../DESIGN-SYSTEM.md](../../DESIGN-SYSTEM.md).

## Pièges
* Les polices ne sont **pas** embarquées : chargez-les (index.html).
* Un `:root { --c-text: #000 }` dans votre CSS global **écrase** l'alias du framework : supprimez ces définitions, utilisez `--art-text`.
