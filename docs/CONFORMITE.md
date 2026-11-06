# Conformité au cahier des charges — état réel

Légende : ✅ fait et vérifié · ⚠️ partiel (précisé) · ❌ non fait.
Vérifications effectuées : compilation des 4 bibliothèques (ng-packagr) et de la démo (dev + production), **241 tests automatisés** (Vitest + jsdom + axe-core), tous verts.
**Non effectué : test visuel dans un vrai navigateur** (aucun navigateur disponible dans l'environnement de construction). Le rendu est validé par tests DOM, pas à l'œil : une passe visuelle sur la démo (`npm start`) est à faire en premier.

## Exigences fonctionnelles

| # | Exigence | État | Détail |
|---|---|---|---|
| 1 | Design System : fichier unique de tokens | ✅ | 202 tokens (couleurs primaire/secondaire/accent/succès/danger/warning/info/neutres 50→900 + sémantiques, typo, espacements xs→4xl, bordures, ombres xs/sm/md/lg/popup, transitions, z-index), `@layer art.tokens`, surcharge projet sans toucher au framework |
| 1 | Composants consomment uniquement les tokens | ⚠️ | **0** `#hex` / `rgb()` dans les CSS de composants ; rayons, ombres, tailles de police, graisses, durées, z-index et la majorité des espacements tokenisés par migration automatique. Reste en dur : dimensions fonctionnelles (largeurs/hauteurs/positions), géométrie des anneaux de focus, épaisseurs `1.5px`, quelques espacements impairs, spectre de teinte du sélecteur (7 `hsl()`), fenêtre PDF (valeurs résolues depuis les tokens). Voir DESIGN-SYSTEM.md. Les valeurs d'origine ont été arrondies à l'échelle (±1 px). |
| 1 | Thèmes prêts à l'emploi | ✅ | `light`, `dark`, `ocean`, `forest` + `ThemeService` (`auto` = préférence système) |
| 1 | Documentation des tokens | ✅ | `docs/TOKENS.md` généré (`npm run docs:tokens`) |
| 2 | Champ `color` amélioré | ✅ | Pastille d'aperçu + hex éditable + sélecteur avancé (zone S/V, teinte, RVB, TSL), palette de marque (champ ou `ART_COLOR_PALETTE`), temps réel. Pas de canal alpha. |
| 3 | Champ `file` | ✅ | Mono/multi, nom/taille/type/aperçu image/suppression, validation (taille, MIME/extensions, nombre), glisser-déposer + clavier, progression, endpoint configurable, erreurs (format, taille, réseau) avec réessai, valeur `{name,size,type,url?,id?}` |
| 4 | Explication contextuelle sur tout label | ⚠️ | ✅ champ, section et formulaire enfant (form), colonne/titre/stat (liste), carte/colonne/champ (détail) ; filtres (puces). Déclencheur clic/survol configurable (`explanationTrigger`), Markdown restreint sans `innerHTML`, accessible. ❌ pas encore branché sur les **onglets** (`TabConfig.explanation` existe dans le modèle), les libellés de **tri** et boutons de barre d'outils ; `<art-label>` permet de l'étendre. |
| 5 | Modale générique | ✅ | `ModalService.open(config): Promise`, tous les champs de `ModalConfig`, résultat par `ModalRef.close()` ou `@Output closed`, `undefined` (ou rejet si `rejectOnDismiss`), 2+ niveaux, focus trap, restauration du focus, `role=dialog`/`aria-modal`. Cas « + client dans un formulaire de vente » : démo (`/modal`). |
| 6.1 | Client API | ✅ | `get/post/put/patch/delete`, `list` (contrat page/pageSize/sort/filter/q), `upload` (progression), annulation (`signal`, `cancelKey`, `cancelAll`), `X-Request-Id`, Bearer, refresh automatique, redirection login sur 401 |
| 6.2 | Sécurité | ✅ | Stockage `localStorage`/`sessionStorage`/`memory`, session (login/logout/refresh/expiration), `authGuard`/`guestGuard`/`roleGuard`, politique XSS (aucun `bypassSecurityTrust*`), CSRF double-submit. Voir SECURITY.md |
| 6.3 | Erreurs & alertes | ✅ | Mapping 400/401/403/404/409/422/429/500/502/503/504/réseau, RFC 7807, codes métier configurables (message + action), toasts automatiques |
| 6.4 | Toaster | ✅ | `success/error/warning/info`, conteneur overlay (6 positions), icône/titre/message/action/durée/fermeture, file + `maxVisible`, `role=status|alert`, `aria-live`, animations tokenisées |
| 7 | Champ `secret` | ✅ | Masque fixe ou proportionnel, copie (+ retour ✓ / toast), œil optionnel avec re-masquage auto, lecture seule/éditable, aucun log, valeur absente du DOM en lecture seule masquée |

## Exigences non fonctionnelles

| Exigence | État | Détail |
|---|---|---|
| Angular LTS, standalone, Signals, `provideHttpClient`, `provideRouter` | ⚠️ | Angular 21 (LTS), tout est standalone, `provideHttpClient` via `provideArtApi`. Signals/`input()`/`output()` dans **tout le nouveau code** ; les composants **historiques portés** gardent `@Input()/@Output()` et état mutable. |
| CSS pur | ✅ | Aucun SCSS |
| WCAG 2.2 AA | ⚠️ | Nouveaux composants conçus et testés (axe-core, 0 violation dans les tests). Composants historiques non audités. Contrastes non mesurés en jsdom. Voir ACCESSIBILITY.md |
| Tests ≥ 80 % | ⚠️ | Instructions / branches / fonctions / lignes : **theme 97,8 / 100 / 100 / 97,2** · **toaster 89,1 / 85,9 / 84,6 / 95,8** · **api 85,7 / 84,3 / 77,4 / 90,5** · **ui 58,3 / 58,0 / 56,9 / 62,4**. Le **nouveau** code de `ui` (modale, champs `color`/`secret`/`file`, explications, filtrage/tri locaux, pied de formulaire tableau) est à 85–98 % ; le code **historique** porté (data-list-table partiel, header, sidebar, tab-view-compact…) tire la moyenne. **Objectif 80 % non atteint sur `@artis/ui`.** Seuils de non-régression dans `angular.json`. Tests d'intégration API et toaster présents. |
| Documentation + démo/Storybook | ⚠️ | README par lib, guides, **manuel complet par composant et module** (`docs/manual/`, tableaux d'API générés depuis le code), application de démonstration. **Storybook non réalisé** (la démo en tient lieu). |
| Build `ng-packagr`, publiable en interne | ✅ | `npm run build:libs` puis `npm run pack:libs` (`.tgz`) |
| SemVer + CHANGELOG | ✅ | 1.0.0 |
| Performance : lazy loading | ✅ | Routes de la démo en `loadComponent` ; démo prod : 743 Ko initial / 158 Ko gzip |
| Performance : `OnPush` par défaut | ⚠️ | 12 composants sur 25 en `OnPush` (tous les nouveaux) ; les composants historiques portés restent en détection `Default` : basculer sans refonte de leur état mutable risquerait des régressions d'affichage non détectables sans test visuel |
| Performance : virtualisation des listes longues | ❌ | Non réalisée (la liste a une pagination intégrée) |

## Critères de succès

| # | Critère | État |
|---|---|---|
| 1 | Nouveau projet en < 30 min | ⚠️ Parcours documenté (GETTING-STARTED) ; durée non mesurée en conditions réelles |
| 2 | DA modifiable par un seul fichier | ✅ (`mon-theme.css` ; démontré par 4 thèmes) |
| 3 | Tous les composants utilisent les tokens | ⚠️ voir ligne « Composants consomment uniquement les tokens » |
| 4 | `file` mono/multi + validation + DnD | ✅ |
| 5 | `secret` masque + copie | ✅ |
| 6 | Explication sur tous les labels | ⚠️ voir exigence 4 |
| 7 | Modale générique + cas client/vente | ✅ |
| 8 | API : auth, erreurs, toasts sans intervention | ✅ (tests d'intégration) |
| 9 | Aucune valeur en dur hors tokens | ⚠️ couleurs : oui ; autres : exceptions listées |
| 10 | 0 violation axe sur tous les composants | ⚠️ 0 sur les composants testés (nouveaux + form-field/form-builder) ; reste de la bibliothèque non audité |

## Évolutions 1.1.0 (retours d'utilisation)

| Sujet | État |
|---|---|
| Upload en erreur 404 | ✅ cause : double préfixe `baseUrl` dans la démo ; corrigé + garde-fou dans `ApiService` + code HTTP dans le message |
| `--c-text` noir en thème sombre | ✅ échelles primitives inversées, alias sémantiques, variables non définies corrigées, **contrôle automatique** `lint:tokens` |
| Bulle ⓘ éloignée (libellé de champ, carte de stat) | ✅ couche supérieure (Popover API) — appliqué aussi au sélecteur de couleur et au filtre de colonne. **Non vérifié visuellement** (tests jsdom + mock de l'API Popover) |
| Tri/filtre locaux ou manuels, filtre au clic par colonne | ✅ `localMode`, `isAutoSorted`/`isAutoFiltered`/`isAutoPagination`, `filterFn`, filtre par colonne, tri par en-tête, clic sur valeur |
| Manuel de chaque composant et module | ✅ `docs/manual/` : 9 pages de modules + 25 pages de composants |
| Formulaire tableau : pied parallèle à l'en-tête | ✅ Supprimer / Ajouter N lignes (défaut 10) / Ajouter une ligne, en-tête **et** pied ; `maxRows`, `bulkAddCount` |

## Périmètre repris de `art-ui-generative`

Repris : footer, header, sidebar, main-layout (génériques), loader, form-builder/child/field, data-list (+ filtre, tri, stats, tableau, export), detail-card/view, tab-view(+compact), directive d'attributs, modèles, utilitaires.
Non repris (spécifiques produit) : pages d'authentification, module SIG, panneau « studio ». Voir MIGRATION.md.

## Corrections de défauts trouvés dans le code d'origine

`alert()` utilisateur et `alert()` de debug, validateurs échouant sur champs optionnels vides, injection HTML dans l'export PDF, injection de formule dans l'export CSV/Excel, dépendance implicite à Bootstrap, `ResizeObserver` non gardé, `<label>` non reliés aux champs, textes et données de projet en dur (marque, utilisateur de démo, endpoints, liens), `.scss` référencés pour des fichiers `.css`.
