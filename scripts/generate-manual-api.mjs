#!/usr/bin/env node
/**
 * Remplit les tableaux « Entrées / Sorties » du manuel (docs/manual/**) directement depuis le code source.
 * Dans un fichier .md, repérer :   <!-- API:art-form-field -->  …  <!-- /API -->
 * Le contenu entre les deux marqueurs est régénéré. Les commentaires JSDoc (/** … *\/ ou // sur la ligne au-dessus
 * ou en fin de ligne) deviennent la colonne « Rôle ».
 * Usage : npm run docs:manual
 */
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const walk = (d) => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
const sources = walk('projects/ui/src').concat(walk('projects/toaster/src')).filter((f) => f.endsWith('.ts') && !f.endsWith('.spec.ts'));

/** selector → { file, inputs[], outputs[] } */
const registry = new Map();
const clean = (s) => s.replace(/\s+/g, ' ').trim();
const esc = (s) => s.replace(/\|/g, '\\|').replace(/\n/g, ' ');

function docAbove(lines, i) {
  const out = [];
  let k = i - 1;
  while (k >= 0 && /^\s*(\/\/|\*|\/\*\*|\*\/)/.test(lines[k])) {
    out.unshift(lines[k].replace(/^\s*(\/\/+|\/\*\*|\*\/|\*)\s?/, '').replace(/\*\/\s*$/, '').trim());
    k--;
  }
  return clean(out.join(' ')).replace(/^[─\-=\s]*[A-Za-z ]*[─\-=\s]*$/, (m) => (m.includes('──') ? '' : m));
}

/** Lit un argument générique `<...>` avec chevrons équilibrés à partir de `from` (position du `<`). */
function balanced(str, from) {
  let depth = 0;
  for (let i = from; i < str.length; i++) {
    if (str[i] === '<') depth++;
    else if (str[i] === '>' && str[i - 1] !== '=') { depth--; if (depth === 0) return str.slice(from + 1, i); }
  }
  return null;
}

for (const f of sources) {
  const src = readFileSync(f, 'utf8');
  const sel = /selector:\s*['"]([^'"]+)['"]/.exec(src);
  const cls = /export (?:abstract )?class (\w+)/.exec(src);
  if (!sel && !/@Directive\(\)/.test(src)) continue;
  const key = sel ? sel[1] : cls?.[1];
  if (!key) continue;
  const lines = src.split('\n');
  const inputs = [], outputs = [];
  lines.forEach((line, i) => {
    let m;
    const trailing = (/\/\/\s*(.+)$/.exec(line) ?? [])[1] ?? '';
    let doc = clean(docAbove(lines, i) + ' ' + trailing);
    if (doc.includes('──')) doc = '';
    if ((m = /@Input\(\)\s*(?:set\s+)?(\w+)\s*(\?|!)?\s*(?::\s*([^=;{(]+?))?\s*(?:=\s*([^;]+))?;?\s*(?:\/\/.*)?$/.exec(line.trim().replace(/\{[^}]*$/, '')))) {
      inputs.push({ name: m[1], type: clean(m[3] ?? 'any'), def: m[4] ? clean(m[4]) : (m[2] === '!' ? '**requis**' : ''), doc });
    } else if ((m = /@Input\(\)\s*set\s+(\w+)\(\s*\w+\s*:\s*([^)]+)\)/.exec(line))) {
      inputs.push({ name: m[1], type: clean(m[2]), def: '', doc });
    } else if ((m = /(?:readonly\s+)?(\w+)\s*=\s*input(\.required)?(?:<([^>]+(?:<[^>]*>)?[^>]*)>)?\(([^)]*)\)/.exec(line))) {
      inputs.push({ name: m[1], type: clean(m[3] ?? 'inféré'), def: m[2] ? '**requis**' : clean(m[4] ?? ''), doc });
    } else if ((m = /@Output\(\)\s*(\w+)\s*=\s*new EventEmitter</.exec(line))) {
      outputs.push({ name: m[1], type: clean(balanced(line, line.indexOf('EventEmitter<') + 12) ?? 'any'), doc });
    } else if ((m = /(?:readonly\s+)?(\w+)\s*=\s*output</.exec(line))) {
      outputs.push({ name: m[1], type: clean(balanced(line, line.indexOf('output<') + 6) ?? 'any'), doc });
    }
  });
  registry.set(key, { file: f, inputs, outputs });
}

const table = (title, rows, withDef) =>
  rows.length
    ? `**${title}**\n\n| Nom | Type | ${withDef ? 'Défaut | ' : ''}Rôle |\n|---|---|${withDef ? '---|' : ''}---|\n` +
      rows.map((r) => `| \`${r.name}\` | \`${esc(r.type)}\` | ${withDef ? (r.def === '**requis**' ? '**requis** | ' : r.def ? '`' + esc(r.def) + '` | ' : '— | ') : ''}${esc(r.doc || '—')} |`).join('\n') + '\n'
    : '';

let filled = 0, missing = [];
for (const md of walk('docs/manual').filter((f) => f.endsWith('.md'))) {
  let s = readFileSync(md, 'utf8');
  const re = /<!-- API:([^\s>]+) -->[\s\S]*?<!-- \/API -->/g;
  s = s.replace(re, (_all, key) => {
    const r = registry.get(key);
    if (!r) { missing.push(`${md}: ${key}`); return `<!-- API:${key} -->\n_(introuvable dans le code)_\n<!-- /API -->`; }
    filled++;
    const body = [
      `Source : \`${r.file.replace(/^projects\//, '')}\``, '',
      table('Entrées', r.inputs, true), table('Sorties (événements)', r.outputs, false),
    ].filter(Boolean).join('\n');
    return `<!-- API:${key} -->\n${body}<!-- /API -->`;
  });
  writeFileSync(md, s);
}
console.log(`Manuel : ${filled} tableaux d'API générés depuis ${registry.size} composants/directives.`);
if (missing.length) { console.error('Introuvables :\n' + missing.join('\n')); process.exit(1); }
