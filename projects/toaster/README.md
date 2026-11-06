# @artis/toaster

```ts
provideToaster({ position: 'top-right', maxVisible: 4 });      // app.config.ts
// racine : <art-toast-container />
toast.success('Enregistré');  toast.error({ message: 'Échec', action: { label: 'Réessayer', handler } });
```
Accessibilité : `role="status"` (succès/info, `aria-live=polite`) / `role="alert"` (erreur/avertissement, `assertive`) ; minuterie suspendue au survol et au focus ; erreurs persistantes par défaut. Voir [../../docs/COMPONENTS.md](../../docs/COMPONENTS.md).
