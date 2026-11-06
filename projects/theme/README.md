# @artis/theme

Tokens CSS, thèmes et `ThemeService` — **la Direction Artistique d'un projet tient dans un fichier**.

```json
"styles": ["node_modules/@artis/theme/styles/index.css", "src/mon-theme.css"]
```
```ts
provideArtTheme({ defaultTheme: 'light', storageKey: 'art-theme' });
inject(ThemeService).set('dark');           // 'light' | 'dark' | 'ocean' | 'forest' | 'auto' | votre thème
```

Contenu de `styles/` : `tokens.css` (202 tokens documentés) · `themes/{light,dark,ocean,forest}.css` · `base.css` (focus visible, `.art-sr-only`, `prefers-reduced-motion`) · `utilities.css` (grille 12 colonnes + flex) · `index.css` (tout).

Voir [../../docs/DESIGN-SYSTEM.md](../../docs/DESIGN-SYSTEM.md) et [../../docs/TOKENS.md](../../docs/TOKENS.md).
