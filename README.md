# Artis UI Framework

Framework Angular interne pour accélérer le développement frontend de tout nouveau projet de l'équipe.
Bibliothèque de composants + services + conventions, **agnostique du domaine métier** : le projet consommateur fournit ses endpoints, sa direction artistique et ses libellés.

| Librairie | Rôle | Dépend de |
|---|---|---|
| **`@artis/theme`** | Tokens CSS (couleurs, typo, espacements, rayons, ombres, transitions, z-index), 4 thèmes prêts (clair, sombre, Ocean, Forest), `ThemeService`, utilitaires de grille | — |
| **`@artis/toaster`** | `ToastService` + `<art-toast-container>` (notifications accessibles) | `@artis/theme` (CSS) |
| **`@artis/api`** | `ApiService`, intercepteurs (auth + refresh, CSRF, X-Request-Id, loader, erreurs), session, guards, erreurs RFC 7807 + codes métier | `@artis/toaster` |
| **`@artis/ui`** | Formulaires (+ `color`, `file`, `secret`, types personnalisés), listes, détails, layout, `ModalService`, explications contextuelles | `@artis/api`, `@artis/toaster`, `@artis/theme` |
| **`demo`** | Application de démonstration (faux backend inclus) | toutes |

Graphe de build : `theme → toaster → api → ui → demo`.

## Démarrage rapide (monorepo)

```bash
npm install            # .npmrc active legacy-peer-deps (voir Notes)
npm run build:libs     # theme → toaster → api → ui   (dans dist/)
npm start              # application de démonstration sur http://localhost:4200
npm test               # tests des 4 bibliothèques (Vitest + jsdom + axe-core)
npm run test:coverage
npm run docs:tokens    # régénère docs/TOKENS.md
npm run docs:manual    # régénère les tableaux d'API du manuel depuis le code
npm run lint:tokens    # contrôle d'intégrité de la DA
npm run pack:libs      # .tgz publiables en npm privé (artifacts/)
```

Pour **utiliser** le framework dans un nouveau projet : [docs/GETTING-STARTED.md](docs/GETTING-STARTED.md) (objectif < 30 min).

## Documentation

| Document | Contenu |
|---|---|
| **[MANUEL](docs/manual/README.md)** | **Un fichier par composant et par module** (usage, API, exemples, accessibilité, pièges) |
| [GETTING-STARTED](docs/GETTING-STARTED.md) | Installer, configurer, afficher un premier formulaire |
| [DESIGN-SYSTEM](docs/DESIGN-SYSTEM.md) | Personnaliser la DA avec **un seul fichier** de tokens |
| [TOKENS](docs/TOKENS.md) | Référence générée de tous les tokens (199) |
| [COMPONENTS](docs/COMPONENTS.md) | Référence : champs, modale, toaster, API, explications |
| [SECURITY](docs/SECURITY.md) | Jetons, XSS, CSRF |
| [ACCESSIBILITY](docs/ACCESSIBILITY.md) | WCAG 2.2 AA : ce qui est fait et vérifié |
| [MIGRATION](docs/MIGRATION.md) | Passer de `art-ui-generative` à `@artis/ui` |
| [CONFORMITE](docs/CONFORMITE.md) | **État réel** face au cahier des charges (fait / partiel / non fait) |
| [CHANGELOG](CHANGELOG.md) | Historique SemVer |

## Notes d'environnement

* Angular **21 (LTS)**, composants standalone, Signals, `provideHttpClient`, `provideRouter`.
* `.npmrc` contient `legacy-peer-deps=true` : requis tant que les peer-deps de `jsdom`/`vitest` ne sont pas alignées avec npm 10.
* Le framework **n'embarque aucune police** : le projet charge *Material Symbols Outlined* (icônes) et sa police de marque (cf. `projects/demo/src/index.html`).
