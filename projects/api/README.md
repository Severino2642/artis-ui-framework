# @artis/api

Couche d'intégration backend : `ApiService`, intercepteurs (auth + refresh, CSRF, `X-Request-Id`, loader, erreurs), `SessionService`, guards, erreurs normalisées (RFC 7807 + codes métier) avec toasts automatiques.

```ts
provideArtApi({ baseUrl: 'https://api.exemple.com', storage: 'memory', businessErrors: { … } });
api.list<Client>('/clients', { page: 1, pageSize: 20, sort: [{ field: 'name', direction: 'asc' }] });
```
Sécurité : [../../docs/SECURITY.md](../../docs/SECURITY.md) · Référence : [../../docs/COMPONENTS.md](../../docs/COMPONENTS.md).
