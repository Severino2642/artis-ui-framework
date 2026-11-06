# `art-file-field` — envoi de fichiers

## À quoi ça sert
Sélectionner et envoyer un ou plusieurs fichiers : glisser-déposer, validation (type, taille, nombre), aperçu des images, **progression** de l'envoi, erreurs par fichier avec réessai.

**Sélecteur** `art-file-field` · **Import** `ArtFileFieldComponent` · Depuis un formulaire : `type: 'file'`.

## Démarrage rapide
```ts
// Un logo image ≤ 2 Mo, envoyé immédiatement
{ name: 'logo', label: 'Logo', type: 'file', fileAccept: ['image/*'], fileMaxSize: 2 * 1024 * 1024, fileUploadUrl: '/files' }

// Jusqu'à 3 justificatifs PDF/PNG
{ name: 'docs', label: 'Justificatifs', type: 'file', fileMultiple: true, fileMaxFiles: 3,
  fileAccept: ['.pdf', 'image/png'], fileUploadUrl: '/files' }
```

<!-- API:art-file-field -->
Source : `ui/src/lib/form/fields/file-field.component.ts`<!-- /API -->

## Options (`FormFieldConfig`)
| Option | Rôle |
|---|---|
| `fileMultiple` | Plusieurs fichiers ; la valeur devient un **tableau** |
| `fileMaxSize` | Taille maximale **par fichier**, en octets |
| `fileAccept` | MIME (`image/png`), joker (`image/*`) ou extension (`.pdf`) |
| `fileMaxFiles` | Nombre maximal (mode multiple) |
| `fileUploadUrl` | Endpoint `POST` multipart. **Relatif à `baseUrl`** de `@artis/api` (ne répétez pas `baseUrl`). Sans lui : pas d'envoi, la valeur contient le `File` |
| `fileFieldName` | Nom du champ multipart (défaut `file`) |
| `fileUploadFields` | Champs multipart supplémentaires |
| `fileMapResponse` | `(body) => ({ id?, url?, name? })` pour une réponse non standard (défaut : `id`/`url`/`name`, éventuellement sous `data`) |

## Valeur : `ArtFileValue`
`{ name, size, type, url?, id?, file? }`
* **Avec** `fileUploadUrl` : la valeur n'est émise qu'**après** un envoi réussi, enrichie de `id`/`url` renvoyés par le serveur (pas de `file`).
* **Sans** `fileUploadUrl` : la valeur contient le `File` natif dans `file` : envoyez-le vous-même au moment de l'enregistrement.
* Mode mono : un `ArtFileValue` ou `null`. Mode multi : un tableau.

## Comportement
| Situation | Résultat |
|---|---|
| Fichier refusé (type, taille, nombre) | Message dans une zone `role="alert"` ; les autres fichiers sont acceptés |
| Envoi en cours | Barre `role="progressbar"` + pourcentage |
| Échec d'envoi | Message **avec le code HTTP** et bouton **Réessayer** ; rien n'est émis pour ce fichier |
| Suppression | Annule l'envoi en cours, retire le fichier, libère l'aperçu |
| Mode mono + nouveau fichier | Remplace l'ancien |
| Valeur initiale | Les fichiers déjà envoyés s'affichent (`[value]` / `initialValues`) |

Les envois passent par `ApiService.upload` : jeton, `X-Request-Id`, loader et annulation sont gérés par `@artis/api`. Les erreurs sont affichées **dans** le champ (pas de toast).

## Accessibilité
Zone de dépôt `role="button"` focusable (Entrée/Espace ouvrent le sélecteur), nommée ; boutons « Supprimer »/« Réessayer » nommés **par fichier** ; erreurs annoncées. Textes traduisibles (`file.*`).

## Pièges
* La validation côté client est une aide : **revalidez côté serveur** (type réel, taille, antivirus).
* Un 404 à l'envoi signifie presque toujours une URL incorrecte : `fileUploadUrl` est préfixée par `baseUrl` (sauf si elle le contient déjà ou est absolue).
