# `art-info-tip` — bulle d'explication ⓘ

## À quoi ça sert
L'icône ⓘ et sa bulle, utilisables seules (`art-label` s'en sert). La bulle s'affiche **toujours à côté de l'icône**, même dans une carte animée, un conteneur défilant ou une modale.

**Sélecteur** `art-info-tip` · **Import** `ArtInfoTipComponent`

## Démarrage rapide
```html
<h3>Chiffre d'affaires <art-info-tip text="Somme des ventes **hors taxes**." label="Chiffre d'affaires" /></h3>
<art-info-tip text="Survolez pour lire." trigger="hover" icon="help" />
```

<!-- API:art-info-tip -->
Source : `ui/src/lib/core/explanation/info-tip.component.ts`
**Entrées**

| Nom | Type | Défaut | Rôle |
|---|---|---|---|
| `text` | `string` | **requis** | Explication (Markdown restreint). |
| `label` | `inféré` | `''` | Libellé auquel l'explication se rapporte (pour l'accessibilité). |
| `trigger` | `'click' \| 'hover'` | `'click'` | Comportement d'ouverture. |
| `icon` | `inféré` | `'info'` | Nom d'icône Material Symbols. |
<!-- /API -->

## Fonctionnement
| Action | Effet |
|---|---|
| Clic / Entrée / Espace (`trigger="click"`, défaut) | Ouvre / ferme |
| Survol ou focus clavier (`trigger="hover"`) | Ouvre ; la sortie ferme |
| Échap | Ferme, rend le focus à l'icône, et **n'atteint pas** une modale parente |
| Clic extérieur | Ferme |
| Défilement d'un conteneur, redimensionnement | La bulle se repositionne |

### Pourquoi elle ne se décale plus
La bulle est affichée en **couche supérieure** (API Popover du navigateur) : un ancêtre avec `transform`, `overflow: hidden` ou `filter` (carte de stat qui s'anime au survol, champ animé) ne peut plus la déplacer ni la rogner. Sans prise en charge de l'API Popover, un repli en `position: fixed` est utilisé.

## Accessibilité
Bouton nommé (`label` complète le nom), `aria-expanded`, `aria-describedby` vers la bulle (toujours présente dans l'arbre d'accessibilité, masquée visuellement quand fermée), `role="tooltip"`, mode survol **et** focus clavier.

## Pièges
* Renseignez `label` : il rend le nom du bouton explicite (« Afficher l'explication : Prix »).
* Le texte accepte un Markdown **restreint** ([markdown-lite](markdown-lite.md)) : pas de HTML.
