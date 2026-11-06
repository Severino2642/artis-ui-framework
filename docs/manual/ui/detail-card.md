# `art-detail-card` — fiche de détail

## À quoi ça sert
Afficher les informations d'**un enregistrement** en lecture : cartes repliables organisées en sections et colonnes, champs typés (texte, nombre, date, badge, multibadge, lien, image), boutons *Modifier / Supprimer* et boutons personnalisés.

**Sélecteur** `art-detail-card` · **Import** `ArtDetailCardComponent`

## Démarrage rapide
```ts
card: DetailCardConfig = {
  id: 'customer', title: 'Client', icon: 'badge', explanation: 'Données issues du CRM.',
  extraButtons: [{ id: 'invoice', label: 'Facturer', icon: 'receipt_long', variant: 'primary' }],
  sections: [{
    columns: [
      { title: 'Contact', explanation: 'Coordonnées principales.',
        sectionColumns: [{ fields: [
          { attribute: 'name',  label: 'Nom' },
          { attribute: 'email', label: 'E-mail', explanation: 'Adresse **professionnelle**.', type: 'link', linkHref: 'mailto:@email' },
        ] }] },
      { title: 'Commercial',
        sectionColumns: [{ fields: [
          { attribute: 'status', label: 'Statut', type: 'badge', badgeColorMap: { actif: 'var(--art-success)', inactif: 'var(--art-danger)' } },
          { attribute: 'revenue', label: 'CA', type: 'number', unit: '€', precision: 2 },
          { attribute: 'since', label: 'Client depuis', type: 'date', dateFormat: 'dd/MM/yyyy' },
        ] }] },
    ],
  }],
};
```
```html
<art-detail-card [config]="card" [data]="customer" (buttonClick)="onButton($event)" />
```
```ts
onButton(e: DetailButtonEvent) {
  switch (e.buttonId) { case '__edit': … ; case '__delete': … ; case 'invoice': … }
}
```

<!-- API:art-detail-card -->
Source : `ui/src/lib/detail/detail-card/detail-card.component.ts`
**Entrées**

| Nom | Type | Défaut | Rôle |
|---|---|---|---|
| `config` | `DetailCardConfig` | **requis** | — |
| `data` | `any` | `{}` | — |
| `isMobile` | `any` | `false` | — |

**Sorties (événements)**

| Nom | Type | Rôle |
|---|---|---|
| `buttonClick` | `DetailButtonEvent` | — |
<!-- /API -->

## `DetailCardConfig`
| Propriété | Défaut | Rôle |
|---|---|---|
| `id` | — | Renvoyé dans `buttonClick.cardId` |
| `title`, `subtitle`, `icon` | — | En-tête |
| `collapsed` | `false` | Carte repliée au départ |
| `sections` | — | `CardSection[]` : `{ columns: CardColumn[], gridCols? }` |
| `showEditButton`, `showDeleteButton` | `true` | Boutons intégrés (identifiants **`__edit`**, **`__delete`**) |
| `extraButtons` | — | `DetailButton[]` : `{ id, label, icon?, variant?, position?: 'left' \| 'right', style?, cssClass? }` |
| `explanation`, `explanationTrigger` | — | ⓘ à côté du titre |

### Colonnes et champs
* `CardColumn` : `{ title?, explanation?, sectionColumns: SectionColumn[] }`.
* `SectionColumn` : `{ fields: DetailField[], colMd? }` (`colMd` sur 12 colonnes, défaut 6).
* `DetailField` : `attribute` (chemin pointé), `label`, `explanation`, `type` (`text` · `number` · `date` · `badge` · `multibadge` · `link` · `image`), `unit`, `precision`, `dateFormat`, `badgeStyle` (`filled`/`outline`), `badgeColorMap`, `badgeDefaultColor`, `displayKey` (multibadge), `linkHref` (`'@attribut'` = dynamique), `linkTarget`, `isRedirectLink` (navigation interne), `formatDuration`, `style`, `cssClass`.

## Accessibilité
Titres et libellés avec ⓘ accessible, boutons nommés. À votre charge : un `label` clair sur chaque champ.

## Pièges
* Sur mobile, les boutons personnalisés passent dans un menu déroulant.
* Les couleurs de badge : utilisez des **tokens** (`var(--art-…)`).
