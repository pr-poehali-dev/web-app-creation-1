import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const swPath = join(__dirname, '../public/sw.js');

let version;
try {
  const hash = execSync('git rev-parse --short HEAD').toString().trim();
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  version = `v${date}-${hash}`;
} catch {
  version = `v${Date.now()}`;
}

const content = readFileSync(swPath, 'utf-8');
const updated = content.replace(
  /const CACHE_VERSION = '[^']*'/,
  `const CACHE_VERSION = '${version}'`
);
writeFileSync(swPath, updated);
console.log(`SW cache version: ${version}`);
