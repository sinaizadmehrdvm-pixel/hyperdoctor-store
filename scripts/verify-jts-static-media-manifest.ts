import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const migration = readFileSync(resolve('supabase/migrations/20260907023000_jts_verified_product_media.sql'), 'utf8');
const expected = [...migration.matchAll(/\('([^']+)',\d+\)/g)].map((m) => `${m[1]}.webp`).sort();
if (expected.length !== 53) throw new Error(`Expected 53 JTS filenames, found ${expected.length}`);
for (const file of expected) {
  const path = resolve('public/catalog/verified/jts', file);
  if (!existsSync(path)) throw new Error(`Missing reconstructed JTS media: ${file}`);
}
console.log(`Verified ${expected.length} reconstructed JTS media filenames against the canonical source mapping.`);
