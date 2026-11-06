# `art-tab-view` et `art-tab-view-compact` — onglets

## À quoi ça sert
Barre d'onglets défilante + contenu de l'onglet actif. Le contenu est fourni sous forme de **`TemplateRef`** : rendu **à la demande** (seul l'onglet actif est créé). La version `compact` est plus dense (même API).

**Sélecteurs** `art-tab-view`, `art-tab-view-compact` · **Imports** `ArtTabViewComponent`, `ArtTabViewCompactComponent`

## Démarrage rapide
```html
<ng-template #general><art-detail-view [config]="view" [data]="customer" /></ng-template>
<ng-template #lines><art-data-list [config]="listConfig" [data]="lines" /></ng-template>

<art-tab-view [tabs]="tabs" activeTabId="general" (tabChange)="onTab($event)" />
```
```ts
@ViewChild('general', { static: true }) general!: TemplateRef<unknown>;
@ViewChild('lines',   { static: true }) lines!: TemplateRef<unknown>;
tabs: TabConfig[] = [];
ngOnInit() {
  this.tabs = [
    { id: 'general', label: 'Général', icon: 'info', template: this.general },
    { id: 'lines',   label: 'Lignes',  icon: 'list_alt', badge: 12, template: this.lines },
    { id: 'archive', label: 'Archive', disabled: true },
  ];
}
```

### `art-tab-view`
<!-- API:art-tab-view -->
Source : `ui/src/lib/detail/tab-view/tab-view.component.ts`
**Entrées**

| Nom | Type | Défaut | Rôle |
|---|---|---|---|
| `tabs` | `TabConfig[]` | `[]` | — |
| `activeTabId` | `string` | — | Id de l'onglet actif par défaut |

**Sorties (événements)**

| Nom | Type | Rôle |
|---|---|---|
| `tabChange` | `TabChangeEvent` | — |
<!-- /API -->

### `art-tab-view-compact`
<!-- API:art-tab-view-compact -->
Source : `ui/src/lib/detail/tab-view-compact/tab-view-compact.component.ts`
**Entrées**

| Nom | Type | Défaut | Rôle |
|---|---|---|---|
| `tabs` | `TabConfig[]` | `[]` | — |
| `activeTabId` | `string` | — | Id de l'onglet actif par défaut |

**Sorties (événements)**

| Nom | Type | Rôle |
|---|---|---|
| `tabChange` | `TabChangeEvent` | — |
<!-- /API -->

## `TabConfig`
| Propriété | Rôle |
|---|---|
| `id` | Identifiant unique |
| `label` | Texte de l'onglet |
| `icon` | Icône Material |
| `badge` | Compteur (affiché si > 0 ; « 99+ » au-delà) |
| `template` | `TemplateRef` du contenu |
| `disabled` | Onglet inactif |
| `explanation` | Présent dans le modèle mais **non affiché** sur l'onglet (un ⓘ cliquable dans un onglet serait un contrôle interactif imbriqué) : placez l'explication dans le **titre du contenu** |

`TabChangeEvent` : `{ previousId, currentId }`.

## Accessibilité (WAI-ARIA Tabs)
`role="tablist"` / `role="tab"` / `role="tabpanel"` reliés par `aria-controls` et `aria-labelledby` ; **tabindex itinérant** (Tab entre dans la liste sur l'onglet actif) ; **← →** changent d'onglet en sautant les onglets désactivés (et bouclent), **Début/Fin** vont aux extrémités ; flèches de défilement décoratives (souris), hors ordre de tabulation.

## Pièges
* Les `@ViewChild` de templates doivent être `static: true` (ou assignés après la vue).
* Changer d'onglet détruit le contenu de l'onglet quitté : conservez l'état dans un service ou le parent.
