# `art-dl-stats` — cartes de statistiques

## À quoi ça sert
Afficher des indicateurs calculés sur les données de la [data-list](data-list.md) (nombre, somme, moyenne, min, max, calcul libre), en cartes ou en bandeau « facture ». En mode local, ils portent sur les données **filtrées**.

**Sélecteur** `art-dl-stats` · **Import** `ArtDataListStatsComponent`

## Démarrage rapide
```ts
stats: [
  { title: 'Total',         calcMethod: 'count', icon: 'inventory_2' },
  { title: 'Chiffre d’affaires', attribute: 'price', calcMethod: 'sum', unit: '€', precision: 2,
    explanation: 'Somme des prix **hors taxes**.' },
  { title: 'Marge moyenne', calcMethod: 'custom', customCalc: (rows) => rows.length ? rows.reduce((s, r) => s + r.margin, 0) / rows.length : 0 },
],
showDefaultCountCard: false,   // masque la carte « total » automatique
```

<!-- API:art-dl-stats -->
Source : `ui/src/lib/list/data-list-stats/data-list-stats.component.ts`
**Entrées**

| Nom | Type | Défaut | Rôle |
|---|---|---|---|
| `stats` | `ComputedStat[]` | `[]` | — |
| `invoiceMode` | `any` | `false` | If true, render as invoice-style summary row (no cards) |
<!-- /API -->

## `StatCardConfig`
| Propriété | Rôle |
|---|---|
| `title`, `subtitle`, `icon`, `unit` | Présentation |
| `attribute` | Chemin de la valeur agrégée |
| `calcMethod` | `count` · `sum` · `avg` · `min` · `max` · `custom` |
| `precision` | Décimales |
| `customCalc` | `(données) => nombre \| texte` (avec `calcMethod: 'custom'`) |
| `formatDuration` | Affiche le résultat comme une durée |
| `indicatorValue`, `indicatorStyle` | Pastille d'évolution (`positive` · `negative` · `neutral`) |
| `visible` | `false` masque la carte |
| `explanation`, `explanationTrigger` | ⓘ à côté du titre |

## Entrées directes (usage seul)
`stats: ComputedStat[]` (= `StatCardConfig` + `computedValue`) ; `invoiceMode` pour le bandeau compact. En pratique la liste calcule les valeurs (`ArtDataListUtilsService.computeAllStats`).

## Pièges
* `customCalc` reçoit **toutes** les lignes filtrées (pas seulement la page affichée).
