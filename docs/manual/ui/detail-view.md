# `art-detail-view` — plusieurs fiches de détail

## À quoi ça sert
Orchestrer **plusieurs** [detail-card](detail-card.md) sur les mêmes données (page de fiche complète). Chaque carte garde sa configuration ; les clics de boutons remontent avec l'`id` de la carte.

**Sélecteur** `art-detail-view` · **Import** `ArtDetailViewComponent`

## Démarrage rapide
```ts
view: DetailViewConfig = { cards: [identityCard, billingCard, historyCard] };
```
```html
<art-detail-view [config]="view" [data]="customer" (buttonClick)="onButton($event)" />
```

<!-- API:art-detail-view -->
Source : `ui/src/lib/detail/detail-view/detail-view.component.ts`
**Entrées**

| Nom | Type | Défaut | Rôle |
|---|---|---|---|
| `config` | `DetailViewConfig` | **requis** | — |
| `data` | `any` | `{}` | — |

**Sorties (événements)**

| Nom | Type | Rôle |
|---|---|---|
| `buttonClick` | `DetailButtonEvent` | — |
<!-- /API -->

## `DetailButtonEvent`
`{ buttonId, cardId?, data }` — `cardId` identifie la carte d'origine.

## Pièges
* Les cartes reçoivent **toutes** le même `data` ; utilisez des chemins pointés (`'billing.iban'`).
