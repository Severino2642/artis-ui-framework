import { HttpRequest } from '@angular/common/http';
import type { ArtApiConfig } from '../api.config';

/**
 * Vrai si la requête vise le backend du projet (URL relative ou commençant par `baseUrl`).
 * Sert à ne JAMAIS envoyer le jeton d'authentification ni le jeton CSRF vers un domaine tiers.
 */
export function isApiRequest(req: HttpRequest<unknown>, cfg: ArtApiConfig): boolean {
  const url = req.url;
  if (!/^[a-z][a-z0-9+.-]*:|^\/\//i.test(url)) return true; // relative
  return !!cfg.baseUrl && url.startsWith(cfg.baseUrl);
}

export function randomId(): string {
  const c = (globalThis as { crypto?: Crypto }).crypto;
  if (c?.randomUUID) return c.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (ch) => {
    const r = (Math.random() * 16) | 0;
    return (ch === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}
