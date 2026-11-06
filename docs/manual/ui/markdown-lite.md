# `art-markdown-lite` — Markdown restreint et sûr

## À quoi ça sert
Afficher un court texte enrichi (gras, italique, liens, retours à la ligne) **sans `innerHTML`** : aucune injection de HTML ou de script n'est possible. Utilisé par les explications contextuelles.

**Sélecteur** `art-markdown-lite` · **Import** `ArtMarkdownLiteComponent` · **Fonction** `parseMarkdownLite(source)`

## Démarrage rapide
```html
<art-markdown-lite source="Voir la **procédure** et [l'aide](https://exemple.com)." />
```

<!-- API:art-markdown-lite -->
Source : `ui/src/lib/core/markdown/markdown-lite.component.ts`
**Entrées**

| Nom | Type | Défaut | Rôle |
|---|---|---|---|
| `source` | `string \| null \| undefined` | `''` | — |
<!-- /API -->

## Syntaxe acceptée
| Écrire | Résultat |
|---|---|
| `**gras**` ou `__gras__` | **gras** |
| `*italique*` ou `_italique_` | *italique* |
| `[texte](https://…)` | lien (nouvel onglet, `rel="noopener noreferrer"`) ; URL avec une paire de parenthèses acceptée |
| retour à la ligne | `<br>` |

Tout le reste (titres, images, listes, **HTML brut**) est affiché **littéralement** comme texte.

## Sécurité
* Rendu par un arbre de nœuds Angular (interpolation = échappement) : jamais d'`innerHTML`.
* Un lien dont le schéma n'est pas `http`, `https`, `mailto`, `tel` ou relatif (`javascript:`, `data:`, `vbscript:`) devient du **simple texte**.

## Utiliser le parseur seul
```ts
const nodes = parseMarkdownLite('a **b**');   // [{ t:'text', text:'a ' }, { t:'b', text:'b' }]
```

## Pièges
* Pas d'imbrication (`**gras *italique***`) : volontairement restreint.
