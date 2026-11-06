# Guide de migration : `art-ui-generative` → `@artis/ui`

## 1. Installation

Remplacez le dossier `src/app/art-ui-generative/` par les paquets, puis chargez `@artis/theme` (voir [GETTING-STARTED](GETTING-STARTED.md)).
Le framework n'importe plus Bootstrap, ne charge plus de police Google dans les CSS de composants et ne contient plus aucune donnée du projet d'origine.

## 2. Renommages automatisables

| Avant | Après |
|---|---|
| sélecteurs `app-*` (`<app-form-builder>`, `<app-data-list>`…) | `art-*` (`<art-form-builder>`, `<art-data-list>`…) |
| directive `[appAttrs]` | `[artAttrs]` |
| classes `…Component`, `…Service`, `…Directive` | préfixe `Art` : `FormBuilderComponent` → `ArtFormBuilderComponent`, `DataListComponent` → `ArtDataListComponent`, `FooterComponent` → `ArtFooterComponent`… |
| `FromBuilderService` (faute) | `ArtFormBuilderService` |
| `FieldValidationService`, `SidebarService`, `MainLayoutService` | `ArtFieldValidationService`, `ArtSidebarService`, `ArtMainLayoutService` |
| imports relatifs `…/art-ui-generative/components/…` | `import { … } from '@artis/ui'` |
| interfaces/types (`FormConfig`, `ColumnDef`, `DetailCardConfig`, `NavbarItemCPLModel`…) | **inchangés** (mêmes noms), exportés par `@artis/ui` |

Sed de départ :

```bash
grep -rl "art-ui-generative" src | xargs sed -i -E \
  -e "s/<app-(form-builder|form-child|form-field|data-list|detail-card|detail-view|tab-view|tab-view-compact|header|sidebar|footer|main-layout|loader)/<art-\1/g" \
  -e "s#</app-(form-builder|form-child|form-field|data-list|detail-card|detail-view|tab-view|tab-view-compact|header|sidebar|footer|main-layout|loader)>#</art-\1>#g" \
  -e "s/appAttrs/artAttrs/g"
```

(puis corriger les imports TypeScript vers `@artis/ui` et ajouter le préfixe `Art` aux classes).

## 3. Changements de comportement et d'API

| Sujet | Avant | Après |
|---|---|---|
| `SidebarComponent.onStudioMode` | affichait `StudioLeftPanelComponent` (code du projet d'origine) | `alternatePanel` + contenu projeté `[artSidebarPanel]` |
| `MainLayoutComponent` | menus, utilisateur, notifications **codés en dur**, `AuthentificationService` du projet | **entièrement piloté par entrées** : `menuItems`, `user`, `notifications`, `profileMenuItems`, `brandName`, `logoUrl`… ; sorties `itemSelected`, `profileAction`, `logout`, `search`… ; `autoLogout` appelle `SessionService.logout()` |
| `SidebarService` | endpoint `/menus`, `localStorage` en dur, `ApiService` du projet | `ART_SIDEBAR_CONFIG` (`menusEndpoint`, clés, stockage) + `ApiService` de `@artis/api` |
| `ApiService` du projet (Promises) | `await api.get<T>(url)` | `ApiService` de `@artis/api` : Observables ; variantes Promise `getAsync/postAsync/putAsync/patchAsync/deleteAsync` |
| `loaderInterceptor` (exclusions Nominatim/OSRM/`/api/auth` en dur) | classe d'intercepteur | `loaderInterceptor` fonctionnel dans `@artis/api`, exclusions via `loaderExcludedUrls` / `SKIP_LOADER` ; `LoaderService` (+ signal `loading`) |
| `LoaderComponent` | template + service du projet | `<art-loader />` branché sur `LoaderService` de `@artis/api` |
| Footer | marque « Artis », liens `status.artis.io` par défaut | **vide par défaut** : `companyName`, `tagline`, `linkGroups`… à fournir |
| Header / Sidebar | utilisateur de démo « Danang Calvin », marque « Artis », logo en dur | vide ; `brandName`, `logoUrl` |
| `form-builder` formulaire invalide | `alert(...)` | toast d'avertissement (`ART_UI_TEXTS.form.invalid`) |
| `field-validation` | un `alert('Validator min…')` de debug | supprimé |
| Validateurs sur valeur **vide** | `email`, `url`, `pattern`, `minLength`… échouaient même sur un champ optionnel vide | seuls `required` et `custom` s'évaluent sur une valeur vide |
| `form-field` autocomplete | `HttpClient` direct, `?q=` concaténé | `ApiService` (auth, tracing, erreurs) + `cancelKey` : une frappe annule la requête précédente |
| Champ `color` | `<input type="color">` natif | aperçu + hex éditable + sélecteur avancé + palette (`colorPalette` / `ART_COLOR_PALETTE`) |
| `<label>` des champs | non reliés aux contrôles | `<label for>` + `id` unique, `aria-invalid`, `aria-describedby` sur les erreurs |
| Textes (`-- Choisir --`, `Vrai/Faux`, `Min/Max`…) | en dur | `ART_UI_TEXTS` / `provideArtUiTexts({ … })` |
| `ResizeObserver` | supposé présent | gardé (SSR / tests) |
| Export PDF (data-list) | valeurs de cellules injectées sans échappement dans la fenêtre d'impression | échappées (`escapeHtml`) ; couleurs lues depuis les tokens du thème actif |
| `data-list` : `isAutoSorted` seul | `sortChange` n'était émis que si `isAutoSorted === false` ; le filtre n'était jamais local | `sortChange` / `filterApply` / `pageChange` sont émis **dans tous les modes** ; `localMode` (ou `isAutoSorted`/`isAutoFiltered`) active le calcul par le framework |
| `data-list` : tri | Valeurs vides mêlées au reste, texte « 10 » avant « 2 » | Vides **toujours en dernier**, tri naturel du texte |
| `form-child` | Lignes cochées dès leur création, un seul bouton d'ajout (en-tête) | Pas de cochage parasite ; **pied** avec Supprimer / Ajouter N lignes / Ajouter une ligne, identique à l'en-tête |
| Onglets (`tab-view`) | Boutons sans rôle ARIA | `tablist`/`tab`/`tabpanel`, flèches clavier |
| `[appAttrs]` | Tout attribut accepté | `on*`, `srcdoc`, `formaction`, `javascript:` refusés |
| Export CSV/Excel | Cellules `=…`, `+…`, `-…`, `@…` interprétées comme formules | Préfixées d'une apostrophe |
| Bootstrap (`row`, `col-md-*`, `d-flex`, `gap-*`…) | requis implicitement | sous-ensemble fourni par `@artis/theme` (`utilities.css`, noms compatibles) ; Bootstrap **n'est plus requis** |
| Polices (`@import url(fonts.googleapis…)` dans les CSS) | présents dans chaque composant | **supprimés** : le projet charge ses polices |
| `.scss` référencés mais fichiers `.css` | incohérent | tout est en `.css` |

## 4. CSS : variables

* Les `#hex`, `rgba()` et valeurs de rayon/ombre/taille/graisse/durée/z-index/espacement des CSS ont été convertis en tokens `--art-*`.
* Les anciennes variables locales (`--c-neutral-*`, `--c-orange-*`, `--fb-*`, `--dc-*`, `--footer-*`…) sont conservées **comme alias** : vos surcharges existantes continuent de fonctionner.
* Correspondance principale : `--c-orange-600` → `--art-primary-600` · `--c-neutral-N` → `--art-neutral-N` · `--shadow-sm/md/lg/popup` → `--art-shadow-*` · `--r-*` → `--art-radius-*` · `--dur*` → `--art-duration-*`.

## 5. Non repris dans le framework (à conserver côté projet)

* **Pages d'authentification** (`login`, `register`, carrousel) : spécifiques au produit (slides marketing). Utilisez `SessionService.login()` / `authGuard` de `@artis/api` pour leur logique.
* **Module SIG** (`map-picker`, `map-viewer`, géocodage) : domaine spécifique, dépend de services externes. Candidat à un futur paquet `@artis/geo`.
* **`StudioLeftPanelComponent`** : code du projet d'origine → à projeter via `[artSidebarPanel]`.
* Les **démos** ont été déplacées dans l'application `projects/demo`.

## 6. Checklist de migration

- [ ] `@artis/*` installés, thème et polices chargés
- [ ] Sélecteurs et classes renommés ; imports → `@artis/ui`
- [ ] `provideArtApi` (endpoints, `businessErrors`) ; `ApiService` du projet remplacé
- [ ] `<art-toast-container />` et `<art-loader />` ajoutés ; ancien loader supprimé
- [ ] `MainLayout` : données passées par entrées (menu, utilisateur, notifications)
- [ ] Footer/Header/Sidebar : `brandName`, `logoUrl`, liens fournis
- [ ] Rechercher `alert(` / `console.` résiduels dans vos écrans
- [ ] Vérifier visuellement (écarts de ±1 px possibles liés à la normalisation sur l'échelle de tokens)
