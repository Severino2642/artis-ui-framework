# `art-loader` — chargement global

## À quoi ça sert
Voile de chargement plein écran, affiché **automatiquement** tant qu'au moins une requête HTTP est en cours (via `LoaderService` de [`@artis/api`](../modules/api.md)).

**Sélecteur** `art-loader` · **Import** `ArtLoaderComponent`

## Démarrage rapide
```html
<!-- composant racine, une seule fois -->
<art-loader />
<art-loader text="Chargement des ventes…" />
```

<!-- API:art-loader -->
Source : `ui/src/lib/layout/loader/loader.component.ts`
**Entrées**

| Nom | Type | Défaut | Rôle |
|---|---|---|---|
| `text` | `inféré` | `'Chargement en cours…'` | Texte affiché (et annoncé aux lecteurs d'écran). |
<!-- /API -->

## Contrôler le loader
| Besoin | Comment |
|---|---|
| Pas de loader pour une requête | `api.get(url, { skipLoader: true })` ou `SKIP_LOADER` |
| Pas de loader pour une URL | `provideArtApi({ loaderExcludedUrls: ['/poll'] })` |
| Loader manuel | `inject(LoaderService).show()` / `.hide()` (toujours appairés) |
| Lire l'état | `loader.loading()` (signal) |

## Accessibilité
`role="status"` + `aria-live="polite"` : le texte est annoncé. Animation ralentie si `prefers-reduced-motion`.

## Pièges
* Un `show()` sans `hide()` bloque l'écran : utilisez `finalize(() => loader.hide())`.
