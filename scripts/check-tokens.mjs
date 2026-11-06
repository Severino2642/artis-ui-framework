#!/usr/bin/env node
/**
 * Contrôle d'intégrité de la Direction Artistique. Échoue (code 1) si :
 *  1. une primitive neutre/primaire de tokens.css n'est pas redéfinie par le thème sombre
 *     (sinon un composant qui la référence directement resterait « noir » en sombre) ;
 *  2. un CSS de composant contient une couleur codée en dur (#hex, rgb(a)) ;
 *  3. un `var(--art-xxx)` référence un token inexistant ;
 *  4. un CSS de composant utilise une variable locale `var(--x)` jamais définie (ex. `--c-text` oublié).
 * Usage : npm run lint:tokens
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const walk = (d) => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
const css = [...walk('projects/ui/src'), ...walk('projects/toaster/src')].filter((f) => f.endsWith('.css'));
const tokens = readFileSync('projects/theme/src/styles/tokens.css', 'utf8');
const dark = readFileSync('projects/theme/src/styles/themes/dark.css', 'utf8');
const declared = new Set([...tokens.matchAll(/(--art-[\w-]+)\s*:/g)].map((m) => m[1]));
const errors = [];

// 1. primitives inversées en sombre
for (const name of declared) {
  if (/^--art-(neutral|primary)-\d+$/.test(name) && !new RegExp(`${name}\\s*:`).test(dark)) errors.push(`dark.css ne redéfinit pas ${name}`);
}
const ALLOWED_INLINE = new Set(['--badge-c', '--main-margin-left', '--fmt-color', '--art-modal-level']); // posées en `style=""` par le gabarit
for (const f of css) {
  const s = readFileSync(f, 'utf8');
  // 2. couleurs en dur
  for (const m of s.matchAll(/#[0-9a-fA-F]{3,8}\b|\brgba?\(/g)) errors.push(`${f}: couleur en dur « ${m[0]} »`);
  // 3. tokens inexistants
  for (const m of s.matchAll(/var\((--art-[\w-]+)/g)) if (!declared.has(m[1]) && !ALLOWED_INLINE.has(m[1])) errors.push(`${f}: token inconnu ${m[1]}`);
  // 4. variables locales non définies
  const defined = new Set([...s.matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1]));
  for (const m of s.matchAll(/var\((--[\w-]+)/g)) {
    const v = m[1];
    if (!v.startsWith('--art-') && !defined.has(v) && !ALLOWED_INLINE.has(v)) errors.push(`${f}: variable locale non définie ${v}`);
  }
}
if (errors.length) {
  console.error(`✖ ${errors.length} problème(s) de tokens :\n` + [...new Set(errors)].map((e) => '  - ' + e).join('\n'));
  process.exit(1);
}
console.log(`✔ Tokens cohérents : ${declared.size} tokens, ${css.length} CSS contrôlés, thème sombre complet.`);
