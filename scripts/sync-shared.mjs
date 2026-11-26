// Copia packages/shared/src/index.ts a ambas apps (evita problemas de workspaces con Metro/Next).
import { mkdirSync, copyFileSync } from 'node:fs'
for (const d of ['apps/web/lib/shared', 'apps/mobile/lib/shared']) {
  mkdirSync(d, { recursive: true }); copyFileSync('packages/shared/src/index.ts', `${d}/index.ts`)
}
console.log('Shared sincronizado en web y mobile ✓')
