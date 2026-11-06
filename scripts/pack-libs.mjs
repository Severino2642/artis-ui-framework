#!/usr/bin/env node
/** Empaquette les 4 bibliothèques buildées (dist/*) en .tgz dans artifacts/ pour publication npm interne. */
import { execSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
mkdirSync('artifacts', { recursive: true });
for (const lib of ['theme', 'toaster', 'api', 'ui']) {
  execSync(`npm pack ./dist/${lib} --pack-destination ./artifacts`, { stdio: 'inherit' });
}
