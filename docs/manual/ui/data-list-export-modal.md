# `art-dl-export-modal` — fenêtre d'export

## À quoi ça sert
Choisir **le format** (CSV, Excel, PDF, XML, JSON), **les colonnes** et **la quantité** (toutes les données, page actuelle, page précise) puis télécharger. Ouverte par le bouton « Exporter » de la [data-list](data-list.md).

**Sélecteur** `art-dl-export-modal` · **Import** `ArtDataListExportModalComponent`

<!-- API:art-dl-export-modal -->
Source : `ui/src/lib/list/data-list-export-modal/data-list-export-modal.component.ts`
**Entrées**

| Nom | Type | Défaut | Rôle |
|---|---|---|---|
| `columns` | `ColumnDef[]` | `[]` | — |
| `allData` | `any[]` | `[]` | — |
| `currentPageData` | `any[]` | `[]` | — |
| `isAutoPagination` | `any` | `true` | — |
| `totalPages` | `any` | `1` | — |
| `currentPage` | `any` | `1` | — |
| `listTitle` | `any` | `'Export'` | — |
| `totalDataCount` | `any` | `0` | — |

**Sorties (événements)**

| Nom | Type | Rôle |
|---|---|---|
| `close` | `void` | — |
| `fetchPage` | `FetchPageEvent` | Emitted when we need the parent to provide a specific page's data |
<!-- /API -->

## Export complet côté serveur
Avec une pagination **manuelle** (`isAutoPagination: false`), « toutes les données » ne sont pas en mémoire : la fenêtre émet `fetchPage` (relayé par la liste en `exportFetchPage`) pour que **vous** fournissiez chaque page.
```html
<art-data-list [config]="config" [data]="page.items" (exportFetchPage)="loadForExport($event)" />
```

## Sécurité des exports
* **PDF** : titre et valeurs sont **échappés** ; les couleurs du document viennent des tokens du thème actif.
* **CSV / Excel** : protection contre l'**injection de formule** — une cellule texte commençant par `=`, `+`, `-` ou `@` est préfixée d'une apostrophe (les nombres négatifs restent des nombres).
* **XML** : caractères spéciaux échappés.

## Accessibilité
Cases et boutons radio natifs avec libellés ; fermeture par le bouton ✕.
