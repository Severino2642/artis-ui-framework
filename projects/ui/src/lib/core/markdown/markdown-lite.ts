import { sanitizeUrl } from '@artis/api';

/** Nœud produit par le parseur Markdown restreint. */
export type MdNode =
  | { t: 'text'; text: string }
  | { t: 'b'; text: string }
  | { t: 'i'; text: string }
  | { t: 'a'; text: string; href: string }
  | { t: 'br' };

const TOKEN = /(\*\*[^*\n]+\*\*|__[^_\n]+__|\*[^*\n]+\*|_[^_\n]+_|\[[^\]\n]+\]\((?:[^()\s]|\([^()\s]*\))+\))/g;

/**
 * Parseur Markdown RESTREINT : **gras**, *italique* (ou _italique_), [lien](https://…) et retours à la ligne.
 *
 * Sécurité : le résultat est un arbre de nœuds rendu par Angular (interpolation = échappement automatique),
 * il n'y a donc jamais d'`innerHTML`. Les liens dont le schéma n'est pas http(s)/mailto/tel/relatif sont
 * rendus comme du simple texte. Tout le reste du Markdown (titres, images, HTML brut…) est affiché littéralement.
 */
export function parseMarkdownLite(source: string | null | undefined): MdNode[] {
  const nodes: MdNode[] = [];
  const lines = String(source ?? '').split(/\r?\n/);
  lines.forEach((line, idx) => {
    if (idx > 0) nodes.push({ t: 'br' });
    let last = 0;
    for (const m of line.matchAll(TOKEN)) {
      const tok = m[0];
      const start = m.index ?? 0;
      if (start > last) nodes.push({ t: 'text', text: line.slice(last, start) });
      if (tok.startsWith('**') || tok.startsWith('__')) nodes.push({ t: 'b', text: tok.slice(2, -2) });
      else if (tok.startsWith('[')) {
        const close = tok.indexOf('](');
        const text = tok.slice(1, close);
        const href = sanitizeUrl(tok.slice(close + 2, -1));
        nodes.push(href ? { t: 'a', text, href } : { t: 'text', text });
      } else nodes.push({ t: 'i', text: tok.slice(1, -1) });
      last = start + tok.length;
    }
    if (last < line.length) nodes.push({ t: 'text', text: line.slice(last) });
  });
  return nodes;
}
