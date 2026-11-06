# Référence (aide-mémoire)

> Le **manuel complet**, composant par composant, est dans [manual/README.md](manual/README.md). Cette page n'est qu'un aide-mémoire.

## Champs de formulaire (`FormFieldConfig`)

Types : `text number date time datetime textarea select multiselect autocomplete interval color file secret` + types personnalisés.
Options communes : `name label type required colSpan(1-12) defaultValue isReadOnly placeholder validation buttons **explanation**`.

### `color`
| Option | Rôle |
|---|---|
| `colorPalette?: string[]` | Palette de marque proposée (surcharge `ART_COLOR_PALETTE`) |
Valeur : `'#RRGGBB'` (majuscules), émise **en temps réel**. Saisie hex éditable, sélecteur (zone S/V, teinte, RVB, TSL, palette), aperçu.

### `secret`
| Option | Défaut | Rôle |
|---|---|---|
| `secretMaskMode` | `fixed` | `fixed` : N points ; `length` : un point par caractère |
| `secretMaskLength` | `10` | Nombre de points (mode `fixed`) |
| `secretCopyable` | `true` | Bouton copier |
| `secretRevealable` | `false` | Bouton œil (révélation temporaire) |
| `secretRevealTimeout` | `10000` | Re-masquage auto (ms ; `0` = jamais) |
| `secretCopyFeedback` | `icon` | `icon` (✓), `toast`, `both` |
`isReadOnly: true` pour un affichage seul (la valeur n'est alors pas dans le DOM tant qu'elle n'est pas révélée).

### `file`
| Option | Rôle |
|---|---|
| `fileMultiple` | Plusieurs fichiers (valeur = tableau) |
| `fileMaxSize` | Octets par fichier |
| `fileAccept` | `['image/*', 'application/pdf', '.csv']` |
| `fileMaxFiles` | Nombre max (mode multiple) |
| `fileUploadUrl` | Endpoint POST multipart (via `ApiService.upload`) ; sans lui, la valeur contient le `File` |
| `fileFieldName`, `fileUploadFields` | Nom du champ multipart, champs additionnels |
| `fileMapResponse` | Convertit la réponse serveur en `{ id?, url?, name? }` |
Valeur : `ArtFileValue { name, size, type, url?, id?, file? }` — n'est émise **qu'après** envoi réussi quand un endpoint est configuré.

### Type personnalisé
```ts
@Component({ selector: 'app-rating', standalone: true, template: `…` })
export class RatingField extends ArtFieldBase {   // entrées : config, value, inputId, readonly, invalid, describedBy, compact ; sorties : valueChange, blurred
  pick(n: number) { this.valueChange.emit(n); }
}
providers: [provideArtFieldType('rating', RatingField)]
// config : { name: 'note', type: 'rating', label: 'Note' }
```

## Explications contextuelles

Toute étiquette porte `explanation?: string` (Markdown restreint : `**gras**`, `*italique*`, `[lien](https://…)`, retours à la ligne) et `explanationTrigger?: 'click' | 'hover'` :
champ (`FormFieldConfig`), section (`FormSectionConfig`), formulaire enfant (`ChildFormConfig`), colonne de liste (`ColumnDef`), titre de liste, carte de statistique, champ de tri, carte de détail, colonne et champ de détail, onglet (`TabConfig`, modèle uniquement).
Composants réutilisables : `<art-label text explanation [required] [for] [trigger]>` et `<art-info-tip text label trigger>`.

## Modale

```ts
interface ModalConfig<C> {
  component: Type<C>; inputs?: Record<string, unknown>; title?: string; ariaLabel?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'fullscreen';          // md
  closeOnBackdrop?: boolean;  closeOnEscape?: boolean;  showCloseButton?: boolean;   // true
  rejectOnDismiss?: boolean;                                // false : résout undefined
}
modal.open<C, R>(config): Promise<R | undefined>      modal.openRef(config): ModalRef<R>      modal.dismissAll()      modal.depth()
```
Retour du composant enfant : `inject(ModalRef).close(data)` **ou** `@Output() closed` (EventEmitter/`output()`) ; `cancelled` ferme sans résultat. Données d'entrée : `@Input`/`input()` (via `setInput`) **ou** `inject(ART_MODAL_DATA)`. Marquer l'élément à focaliser avec `data-art-autofocus`.

## Toaster

```ts
toast.success('Enregistré'); toast.error({ message: 'Échec', title?, duration?, action: { label: 'Réessayer', handler }, dismissible?, id?, icon? });
provideToaster({ position: 'top-right' | 'top-center' | 'top-left' | 'bottom-*', maxVisible: 4, durations: { success: 4000, info: 5000, warning: 7000, error: 0 }, titles, closeLabel })
```
File d'attente au-delà de `maxVisible` (compteur « +N »), dédoublonnage par `id`, pause au survol/focus. `<art-toast-container />` à placer **une fois**.

## API (`@artis/api`)

```ts
api.get<T>(path, { params, headers, signal, cancelKey, skipLoader, skipErrorToast, skipAuth })
api.post/put/patch/delete …        api.list<T>(path, { page, pageSize, sort, filters, search }) → Page<T>
api.upload<T>(path, file, { fieldName, fields }) → Observable<{type:'progress',percent}|{type:'done',body}>
api.cancel(key) / api.cancelAll()  api.getAsync/postAsync/… (Promise)
```
Contrat de liste par défaut : `?page=1&pageSize=20&sort=name:asc,age:desc&q=…&filter[status]=ok` (adaptable via `listContract`).

Erreurs : l'intercepteur émet des `ApiError { kind, status, message, title?, code?, detail?, fieldErrors?, traceId?, action? }`.

| HTTP | `kind` | Message par défaut |
|---|---|---|
| 400 / 422 | `validation` | Requête / données invalides (+ erreurs par champ en toast) |
| 401 | `session-expired` | Session expirée (refresh tenté d'abord) ; sur le login : « Identifiants incorrects. » |
| 403 | `forbidden` | Accès refusé |
| 404 | `not-found` | Ressource introuvable |
| 409 | `conflict` | Conflit |
| 429 | `rate-limited` | Trop de requêtes |
| 500 | `server` | Erreur serveur |
| 502 / 503 | `unavailable` | Service indisponible |
| 504 / 408 | `timeout` | Délai dépassé |
| 0 | `network` | Impossible de joindre le serveur |
| code métier configuré | `business` | Votre message + action (`route`, `href` ou `handler`) |

Le message affiché vient **toujours** de cette table (jamais du corps serveur, potentiellement technique) ; `detail`, `title` (RFC 7807), `traceId` restent disponibles sur l'`ApiError`. Code métier lu dans `code`, `error.code`, `errorCode`, l'en-tête `X-Error-Code` ou via `extractErrorCode`.

Contextes par requête (`HttpContext`) : `SKIP_LOADER`, `SKIP_AUTH`, `SKIP_ERROR_TOAST`.
Ordre des intercepteurs : `requestId → csrf → loader → error → auth` (+ vos intercepteurs en dernier via `provideArtApi(cfg, { interceptors })`).

## Textes (i18n)

`provideArtUiTexts({ select: { choose: '-- Select --' }, file: { dropHere: 'Drop files here' }, … })` — tous les textes affichés par les composants du framework sont surchargeables (`ArtUiTexts`).
