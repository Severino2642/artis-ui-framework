#!/usr/bin/env node
/**
 * Génère docs/TOKENS.md à partir de projects/theme/src/styles/tokens.css.
 * Convention : une ligne `/* @doc <texte> *\/` précède un token (ou un groupe de tokens).
 * Usage : npm run docs:tokens
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const SRC = 'projects/theme/src/styles/tokens.css';
const OUT = 'docs/TOKENS.md';
const lines = readFileSync(SRC, 'utf8').split('\n');

const sections = [];
const seen = new Set();
let cur = null;
let pendingDoc = null;

for (const raw of lines) {
  const line = raw.trim();
  const sec = line.match(/^\/\* ─+ (.+?) ─+ \*\/$/);
  if (sec) { cur = { title: sec[1], rows: [] }; sections.push(cur); pendingDoc = null; continue; }
  const doc = line.match(/^\/\* @doc (.+?) \*\/$/);
  if (doc) { pendingDoc = doc[1]; continue; }
  const tok = line.match(/^(--art-[\w-]+):\s*(.+?);$/);
  if (tok && cur && !seen.has(tok[1])) {
    seen.add(tok[1]);
    cur.rows.push({ name: tok[1], value: tok[2], doc: pendingDoc });
    // La doc d'un groupe s'applique aux tokens consécutifs jusqu'à la prochaine ligne vide / doc.
    continue;
  }
  if (line === '') pendingDoc = pendingDoc && cur?.rows.at(-1)?.doc === pendingDoc ? null : pendingDoc;
}

const esc = (s) => s.replace(/\|/g, '\\|');
let md = `# Référence des tokens (générée)\n\n> Fichier généré par \`npm run docs:tokens\` depuis \`${SRC}\` — ne pas éditer à la main.\n\n`;
md += `Tous les composants @artis/* consomment **uniquement** ces variables. Pour personnaliser, redéfinissez-les dans le fichier de thème du projet (voir [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md)).\n\n`;
for (const s of sections) {
  md += `## ${s.title}\n\n| Token | Valeur par défaut | Rôle |\n|---|---|---|\n`;
  let lastDoc = '';
  for (const r of s.rows) {
    const d = r.doc ?? lastDoc;
    if (r.doc) lastDoc = r.doc;
    md += `| \`${r.name}\` | \`${esc(r.value)}\` | ${esc(d || '—')} |\n`;
  }
  md += '\n';
}
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, md);
console.log(`${OUT} : ${sections.reduce((n, s) => n + s.rows.length, 0)} tokens documentés dans ${sections.length} catégories.`);
