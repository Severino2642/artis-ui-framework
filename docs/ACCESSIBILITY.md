# Accessibilité (cible WCAG 2.2 AA)

## Ce qui est implémenté et testé (axe-core + tests de comportement)

| Composant | Mesures |
|---|---|
| Info-bulle d'explication | `<button>` nommé (« Afficher l'explication : <libellé> »), `aria-expanded`, `aria-describedby` → bulle toujours présente dans l'arbre d'accessibilité, Échap ferme et rend le focus (sans fermer une modale parente), clic extérieur, mode survol **et** focus clavier |
| Libellés de champ | `<label for>` ↔ `id` unique, `aria-invalid`, `aria-describedby` vers l'erreur (`role="alert"`), étoile « requis » `aria-hidden` |
| Modale | `role="dialog"`, `aria-modal="true"`, `aria-labelledby`/`aria-label`, focus initial, **focus trap** (Tab / Maj+Tab), restauration du focus, Échap, modales empilées (celle du dessous `inert`), pas de fermeture accidentelle par glisser-sélection |
| Toaster | région nommée ; `role="status"`/`aria-live="polite"` (succès, info) et `role="alert"`/`assertive` (erreur, avertissement) ; la minuterie se **suspend au survol et au focus** (WCAG 2.2.1) ; les erreurs ne disparaissent pas seules |
| Champ `file` | zone de dépôt `role="button"` focusable (Entrée/Espace), barre `role="progressbar"` avec `aria-valuenow`, erreurs `role="alert"`, boutons nommés par fichier |
| Champ `secret` | boutons œil/copie nommés, `aria-pressed`, annonce « Valeur copiée » (`aria-live`) |
| Champ `color` | bouton `aria-haspopup="dialog"`/`aria-expanded`, panneau `role="dialog"`, **toutes** les valeurs saisissables au clavier (hex, RVB, TSL, palette, curseur de teinte) ; la zone S/V est un complément à la souris |
| Sections de formulaire | bouton de repli avec `aria-expanded` |
| Global | anneau de focus visible (`:focus-visible`), `prefers-reduced-motion` respecté (durées à 0) |

## Vérification automatisée

`axe-core` (tags `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa`, `best-practice`) est exécuté dans les tests de : info-bulle, `art-label`, modale, champs `color`/`secret`/`file`, `form-field`, `form-builder`. Helper : `expectNoA11yViolations(el)` (`projects/ui/src/lib/testing.ts`).

## Limites connues (honnêteté)

* `color-contrast` n'est pas évaluée par axe en jsdom. Les contrastes dépendent des **tokens du thème** : à vérifier sur la DA du projet (outil : Accessibility Insights / Lighthouse sur la démo).
* Le code **historique porté** (`data-list`, `detail-*`, `header`, `sidebar`, `form-child`, `tab-view`) n'a **pas** été audité composant par composant : seul un test de rendu (et axe sur `form-builder`) existe. Un audit complet est requis avant de revendiquer 0 violation sur l'ensemble de la bibliothèque. Points déjà identifiés : en-têtes de colonne triables par clic (à rendre navigables au clavier), bascule de menus, onglets.
* L'exécution d'axe sur `form-builder` désactive la règle `nested-interactive` : l'en-tête de section reste un bloc cliquable (souris) qui contient l'icône ⓘ et le bouton de repli ; la navigation clavier passe par le bouton de repli. À refondre pour supprimer cette exception.
* Test lecteur d'écran réel (NVDA/VoiceOver) non effectué.
