// Cross-platform test runner (Windows shells don't expand tests/*.test.js).
import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const dir = process.argv[2] || 'tests';
const files = readdirSync(dir).filter(f => f.endsWith('.test.js')).sort().map(f => `${dir}/${f}`);
process.exit(spawnSync(process.execPath, ['--test', ...files], { stdio: 'inherit' }).status ?? 1);
