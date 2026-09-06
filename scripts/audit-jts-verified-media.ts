import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const migrationPath = resolve('supabase/migrations/20260907023000_jts_verified_product_media.sql');
const preparePath = resolve('scripts/prepare-jts-verified-media.ts');
const partsDir = resolve('assets/catalog/jts-v281');

for (const path of [migrationPath, preparePath]) {
  if (!existsSync(path)) throw new Error(`Missing Version 281 file: ${path}`);
}
if (!existsSync(partsDir)) throw new Error('Missing Version 281 JTS media bundle parts');

const migration = readFileSync(migrationPath, 'utf8');
const prepare = readFileSync(preparePath, 'utf8');
const parts = readdirSync(partsDir).filter((name) => /^part-\d{2}\.b64$/.test(name)).sort();

const mappings = [...migration.matchAll(/\('JTS-[^']+',\d+,'JTS-[^']+\.webp'\)/g)];
if (mappings.length !== 53) throw new Error(`Expected 53 JTS media mappings, found ${mappings.length}`);
if (parts.length !== 10) throw new Error(`Expected 10 bundle parts, found ${parts.length}`);

const requiredMigrationTokens = [
  'file_0000000098d481f4a1baa422ec264c0d',
  '/catalog/verified/jts/',
  "'CATALOG'",
  "'VERIFIED'",
  'No generated, synthetic, stock, or substitute imagery.',
  'refuses to publish JTS products',
  'refuses nonzero current JTS product price/stock',
];
for (const token of requiredMigrationTokens) {
  if (!migration.includes(token)) throw new Error(`Version 281 migration missing token: ${token}`);
}

for (const forbidden of ['BranchProductPrice', 'WarehouseInventory', 'insert into public."Order"', 'update public."Product" set "isPublished"=true']) {
  if (migration.toLowerCase().includes(forbidden.toLowerCase())) {
    throw new Error(`Version 281 migration must not modify current commerce/publication data: ${forbidden}`);
  }
}

if (!prepare.includes('8e143d452b03e5638d6d03519377469d3ded854af7f5c03f842ed0bf10914b11')) {
  throw new Error('Version 281 media preparation must pin the verified archive checksum');
}
if (!prepare.includes('expectedFiles = 53')) throw new Error('Version 281 media preparation must verify 53 files');
if (!prepare.includes("'WEBP'")) throw new Error('Version 281 media preparation must verify WEBP containers');

console.log('Version 281 JTS verified-media audit passed: 53 exact source mappings, pinned archive, no commerce/publication writes.');
