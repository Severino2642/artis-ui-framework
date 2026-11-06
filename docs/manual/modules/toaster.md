# Notifications — `@artis/toaster`

## À quoi ça sert
Afficher des messages éphémères (succès, erreur, avertissement, information) empilés, accessibles, avec action optionnelle. `@artis/api` s'en sert automatiquement pour les erreurs HTTP.

## Démarrage rapide
```ts
// app.config.ts
provideToaster({ position: 'top-right', maxVisible: 4 })
```
```html
<!-- composant racine, UNE seule fois -->
<art-toast-container />
```
```ts
const toast = inject(ToastService);
toast.success('Client enregistré');
toast.error({ message: 'Échec de l’envoi', action: { label: 'Réessayer', handler: () => this.retry() } });
```

## `ToastService`
| Méthode | Rôle |
|---|---|
| `success(msg)`, `error(msg)`, `warning(msg)`, `info(msg)` | `msg` = chaîne ou `ToastOptions`. Retourne l'`id`. |
| `show(type, msg)` | Version générique |
| `dismiss(id)` | Ferme (avec animation de sortie) |
| `clear()` | Ferme tout |
| `pause(id)` / `resume(id)` | Suspend / relance la minuterie |
| `runAction(id)` | Exécute l'action puis ferme (sauf `keepOpen`) |
| `all()`, `visible()`, `queued()` | Signaux : tous, affichés, en attente |

## `ToastOptions`
| Option | Défaut | Rôle |
|---|---|---|
| `message` | — | Texte (obligatoire) |
| `title` | selon le type | Titre |
| `duration` | success 4000 · info 5000 · warning 7000 · **error 0** | Durée en ms ; `0` = reste jusqu'à fermeture |
| `action` | — | `{ label, handler, keepOpen? }` |
| `dismissible` | `true` | Bouton ✕ |
| `id` | auto | Même `id` ⇒ **remplace** le toast existant (dédoublonnage) |
| `icon` | selon le type | Icône Material |

## `provideToaster(config)`
| Option | Défaut | Rôle |
|---|---|---|
| `position` | `'top-right'` | `top-left` · `top-center` · `top-right` · `bottom-left` · `bottom-center` · `bottom-right` |
| `maxVisible` | `4` | Au-delà, les toasts attendent en file (compteur « +N ») |
| `durations` | voir ci-dessus | Par type |
| `leaveAnimationMs` | `200` | Durée de l'animation de sortie |
| `titles` | « Succès », « Erreur »… | Titres par défaut (i18n) |
| `closeLabel` | « Fermer la notification » | Nom accessible du bouton ✕ |

## `<art-toast-container />`
<!-- API:art-toast-container -->
Source : `toaster/src/lib/toast-container.component.ts`<!-- /API -->
Aucune entrée : tout passe par le service et `provideToaster`.

## Accessibilité
* Conteneur : `role="region"` nommé « Notifications ».
* Succès/info : `role="status"`, `aria-live="polite"`. Erreur/avertissement : `role="alert"`, `aria-live="assertive"`.
* La minuterie **se suspend** au survol **et** au focus clavier (WCAG 2.2.1). Les erreurs ne disparaissent pas seules.
* Animations désactivées si `prefers-reduced-motion`.

## Pièges
* Plusieurs `<art-toast-container />` ⇒ chaque toast s'affiche plusieurs fois.
* Pour éviter qu'une même erreur s'empile, donnez un `id` stable.
