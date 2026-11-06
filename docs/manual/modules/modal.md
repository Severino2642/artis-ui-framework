# Modale générique — `ModalService`

## À quoi ça sert
Ouvrir **n'importe quel composant Angular** dans une modale, lui passer des données et **récupérer son résultat** sous forme de `Promise` — sans quitter la page. Cas typique : bouton « + » à côté d'un champ « Client » → modale de création → le client créé revient au formulaire.

## Démarrage rapide
```ts
const modal = inject(ModalService);

const client = await modal.open<CreateClientComponent, Client>({
  component: CreateClientComponent,
  title: 'Nouveau client',
  size: 'lg',
  inputs: { defaultName: 'Acme' },
});
if (client) { /* utiliser le client créé */ }      // undefined = fermée sans résultat
```
Dans le composant ouvert (standalone, aucune interface à implémenter) :
```ts
@Component({ standalone: true, template: `…<button (click)="save()">Créer</button>` })
export class CreateClientComponent {
  private ref = inject<ModalRef<Client>>(ModalRef);
  readonly defaultName = input('');               // reçoit inputs.defaultName (ou @Input())
  save() { this.ref.close(this.client); }         // résout la promesse
  cancel() { this.ref.dismiss(); }                // résout undefined
}
```

## Trois façons de rendre un résultat
| Façon | Code dans le composant ouvert |
|---|---|
| **`ModalRef`** (recommandé) | `inject(ModalRef).close(data)` |
| **Sortie `closed`** | `closed = output<Client>()` puis `this.closed.emit(data)` (ou `EventEmitter`) |
| **Fermeture sans résultat** | `ref.dismiss()` ou sortie `cancelled`, Échap, clic sur le fond, bouton ✕ → `undefined` |

## Données d'entrée
* `inputs: { nom: valeur }` sont appliquées avec `setInput` : fonctionne avec `@Input()` **et** `input()`.
* Elles sont aussi disponibles via `inject(ART_MODAL_DATA)` (objet complet).

## `ModalConfig`
| Option | Défaut | Rôle |
|---|---|---|
| `component` | — | Composant à afficher (obligatoire) |
| `inputs` | `{}` | Valeurs d'entrée |
| `title` | — | Titre de l'en-tête (et nom accessible du dialogue) |
| `ariaLabel` | — | Nom accessible si pas de `title` |
| `size` | `'md'` | `sm` 400 px · `md` 560 · `lg` 800 · `xl` 1100 · `fullscreen` |
| `closeOnBackdrop` | `true` | Fermeture au clic sur le fond |
| `closeOnEscape` | `true` | Fermeture par Échap |
| `showCloseButton` | `true` | Bouton ✕ |
| `rejectOnDismiss` | `false` | Si `true`, la promesse est **rejetée** (`ModalDismissedError`) quand fermée sans résultat |

## `ModalService`
| Méthode | Rôle |
|---|---|
| `open<C, R>(config)` | `Promise<R \| undefined>` |
| `openRef<C, R>(config)` | Retourne la `ModalRef` (pour fermer de l'extérieur, ou lire `result`) |
| `dismissAll()` | Ferme toutes les modales |
| `depth()` | Signal : nombre de modales ouvertes |

## `ModalRef<R>`
`close(result?)` · `dismiss()` · `result` (Promise) · `isClosed` · `id`.

## Modales imbriquées
Une modale peut en ouvrir une autre (2 niveaux et plus) : elles **s'empilent** ; seule celle du dessus est active (focus, Échap, lecteurs d'écran) ; celles du dessous sont `inert`. Échap ferme uniquement la plus haute.

## Exemple complet : champ client avec bouton « + »
```ts
@ViewChild('form') form!: ArtFormBuilderComponent;

async onFieldButton(e: FieldButtonEvent) {
  if (e.buttonId !== 'add-client') return;
  const client = await this.modal.open<CreateClientComponent, Client>({ component: CreateClientComponent, title: 'Nouveau client' });
  if (!client) return;
  this.clients = [...this.clients, { value: client.id, label: client.name }];
  this.form.setFieldOption('client', this.clients);
  this.form.setFieldValue('client', client.id);
}
```
Configuration du champ : `{ name: 'client', type: 'select', options: [...], buttons: [{ id: 'add-client', icon: 'add', tooltip: 'Créer un client' }] }`.

## Accessibilité
`role="dialog"`, `aria-modal="true"`, `aria-labelledby` (titre) ou `aria-label`, **focus trap** (Tab / Maj+Tab), focus initial (élément `data-art-autofocus`, sinon premier champ, sinon la boîte), **restauration du focus** sur l'élément déclencheur, Échap, défilement de la page verrouillé puis restauré, `prefers-reduced-motion` respecté.

## Pièges
* Le composant ouvert doit être **standalone**.
* Donnez un nom accessible à vos propres champs dans la modale (`<label>`).
* Ne stockez pas la `ModalRef` après fermeture.
* Les fenêtres flottantes (info-bulles, sélecteurs) s'affichent **au-dessus** de la modale (couche supérieure).
