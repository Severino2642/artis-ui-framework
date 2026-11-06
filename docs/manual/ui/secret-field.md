# `art-secret-field` — valeur sensible

## À quoi ça sert
Afficher ou saisir un mot de passe, un jeton ou une clé d'API : valeur **masquée** par défaut, **copie** en un clic, **œil** pour révéler temporairement. Lecture seule ou éditable.

**Sélecteur** `art-secret-field` · **Import** `ArtSecretFieldComponent` · Depuis un formulaire : `type: 'secret'`.

## Démarrage rapide
```ts
// Clé d'API affichée en lecture seule, copiable et révélable 10 s
{ name: 'apiKey', label: 'Clé d’API', type: 'secret', isReadOnly: true, defaultValue: 'sk_live_…',
  secretRevealable: true, secretCopyFeedback: 'both' }

// Mot de passe à saisir
{ name: 'password', label: 'Mot de passe', type: 'secret', secretMaskMode: 'length', secretRevealable: true,
  validation: { validators: [{ type: 'required' }, { type: 'minLength', length: 8 }] } }
```

<!-- API:art-secret-field -->
Source : `ui/src/lib/form/fields/secret-field.component.ts`<!-- /API -->

## Options (`FormFieldConfig`)
| Option | Défaut | Rôle |
|---|---|---|
| `secretMaskMode` | `'fixed'` | `fixed` : toujours N points ; `length` : un point par caractère |
| `secretMaskLength` | `10` | N en mode `fixed` |
| `secretCopyable` | `true` | Bouton copier |
| `secretRevealable` | `false` | Bouton œil |
| `secretRevealTimeout` | `10000` | Re-masquage automatique (ms) ; `0` = jamais |
| `secretCopyFeedback` | `'icon'` | `icon` (✓ 2 s), `toast`, `both` |
| `isReadOnly` | `false` | Affichage seul |

## Sécurité
* **Lecture seule masquée : la valeur n'est pas dans le DOM**, seul le masque l'est.
* Édition : `<input type="password" autocomplete="new-password">`.
* La valeur n'est **jamais** écrite dans les logs.
* Copie : API Clipboard, repli `execCommand` ; échec ⇒ toast d'erreur.
* Le re-masquage automatique évite de laisser un secret affiché.

## Accessibilité
Boutons nommés (« Afficher/Masquer la valeur », « Copier la valeur »), `aria-pressed` sur l'œil, annonce vocale « Valeur copiée » (`aria-live`). Textes traduisibles (`secret.*`).

## Pièges
* En lecture seule, le mode `fixed` ne révèle pas la longueur du secret.
* Ne mettez pas un secret dans `placeholder` ou dans un `title`.
