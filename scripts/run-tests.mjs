// Cross-platform test runner (Windows shells don't expand tests/*.test.js). 0.9.9: lint gate first (errors fail).
import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const dir = 'tests';
const files = readdirSync(dir).filter(f => f.endsWith('.test.js')).sort().map(f => `${dir}/${f}`);
if (!process.env.SKIP_LINT) {
  const eslint = new URL('../node_modules/eslint/bin/eslint.js', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
  const lint = spawnSync(process.execPath, [eslint, '--quiet', 'src', 'electron', 'scripts', 'proxy', 'tests'], { stdio: 'inherit' });
  if (lint.status !== 0) { console.error('Lint failed (fix the errors above).'); process.exit(lint.status ?? 1); }
  console.log('Lint: 0 errors');
}
process.exit(spawnSync(process.execPath, ['--test', ...files], { stdio: 'inherit' }).status ?? 1);
