/**
 * Utilitaires XSS.
 *
 * Politique par défaut : on n'utilise JAMAIS `bypassSecurityTrust*`. Angular assainit automatiquement
 * les liaisons `[innerHTML]`, `[href]`, `[src]`. Voir docs/SECURITY.md pour les rares cas où un
 * contournement est justifié (contenu provenant d'une source de confiance ET validé côté serveur).
 */

/** Échappe les caractères HTML significatifs. À utiliser avant d'injecter du texte dans une chaîne HTML construite à la main. */
export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const SAFE_URL = /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i;

/**
 * Retourne l'URL si son schéma est sûr (http, https, mailto, tel ou relatif), sinon `null`.
 * Bloque `javascript:`, `data:`, `vbscript:`.
 */
export function sanitizeUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim().replace(/[\u0000-\u001F\u007F]/g, '');
  return SAFE_URL.test(trimmed) && !/^\s*(?:javascript|data|vbscript):/i.test(trimmed) ? trimmed : null;
}
