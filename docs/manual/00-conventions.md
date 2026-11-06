# Conventions communes

## Importer
Tous les composants sont **standalone** : on les ajoute dans `imports: [...]` du composant qui les utilise.

```ts
import { ArtFormBuilderComponent, ArtDataListComponent, ModalService } from '@artis/ui';
import { ToastService, ToastContainerComponent } from '@artis/toaster';
import { ApiService, SessionService } from '@artis/api';
import { ThemeService } from '@artis/theme';
```

## Préfixes
Sélecteurs `art-*` · classes `Art…` (composants, services, directives) · tokens `--art-*` · classes CSS internes courtes (`fb-`, `ff-`, `dlt-`…).

## Pilotage par configuration
Les composants complexes (formulaire, liste, détail) sont pilotés par **un objet de configuration typé** (`FormConfig`, `DataListConfig`, `DetailCardConfig`…) : on décrit *quoi* afficher, jamais *comment*. Les configurations sont du TypeScript pur : sérialisables (sauf les fonctions `fn`, `filterFn`, `customCalc`), testables, réutilisables.

## Événements
Les sorties sont des `EventEmitter`/`output()` ordinaires : `(formAction)="…"`. Les événements utilisent des **identifiants de bouton** (`buttonId`) que vous définissez dans la configuration.

## Explications contextuelles
Tout objet « étiquette » (champ, section, colonne, carte, stat…) accepte `explanation` (Markdown restreint) et `explanationTrigger` (`'click'` | `'hover'`). Voir [label](ui/label.md).

## Icônes
Les noms d'icônes sont ceux de **Material Symbols Outlined** (`add`, `delete_outline`, `filter_alt`…). La police doit être chargée par le projet.

## Style : uniquement des tokens
Aucun composant ne porte de couleur codée en dur. Pour changer l'apparence, redéfinissez des tokens `--art-*` dans le fichier de thème du projet ([theme](modules/theme.md)). Les variables locales historiques (`--fb-*`, `--dc-*`, `--c-*`…) existent encore comme alias.

## Mode zoneless (Angular 21 par défaut)
Les composants **nouveaux** sont en `OnPush` + signaux : aucun souci. Les composants **historiques** (formulaires, listes, détails, layout) sont en détection `Default` : dans une application *zoneless*, ils ne se rafraîchissent que sur événement DOM, signal, `markForCheck` ou changement d'entrée. Conséquences pratiques :
* appelez leurs méthodes publiques depuis un **gestionnaire d'événement** quand c'est possible ;
* si vous les appelez depuis un `setTimeout`, une promesse ou un `subscribe`, ajoutez `cdr.markForCheck()` dans **votre** composant (ou passez les données par `@Input`) ;
* les méthodes qui modifient l'état (`addRow`, `setFieldValue`, `onFilterApply`…) marquent déjà le composant.

## Données : immutabilité
Passez un **nouveau tableau/objet** quand les données changent (`data = [...data, x]`), pas une mutation en place : c'est ce qui déclenche le recalcul.

## Accessibilité
Chaque page indique ce qui est fourni par le composant et ce qui reste à **votre** charge (libellés fournis par la configuration, contrastes de votre thème…).
