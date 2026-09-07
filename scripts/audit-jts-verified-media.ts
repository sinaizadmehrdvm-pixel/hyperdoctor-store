import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const mediaMigrationPath = resolve('supabase/migrations/20260907023000_jts_verified_product_media.sql');
const staticMigrationPath = resolve('supabase/migrations/20260907025000_jts_static_verified_media.sql');
const preparePath = resolve('scripts/prepare-jts-verified-media.ts');
const archivePath = resolve('assets/catalog/jts-v281/jts-v281-media-240q35.tar.gz');
for (const path of [mediaMigrationPath, staticMigrationPath, preparePath, archivePath]) {
  if (!existsSync(path)) throw new Error(`Missing Version 281 completion file: ${path}`);
}

const mediaMigration = readFileSync(mediaMigrationPath, 'utf8');
const staticMigration = readFileSync(staticMigrationPath, 'utf8');
const prepare = readFileSync(preparePath, 'utf8');
const archive = readFileSync(archivePath);
const archiveSha256 = createHash('sha256').update(archive).digest('hex');
const expectedArchiveSha256 = '03995ac266317c4bd2bd7e620dbeef8554dcba9c4b855f7a1c14cc1998371640';
if (archiveSha256 !== expectedArchiveSha256) throw new Error(`Version 281 archive checksum mismatch: ${archiveSha256}`);

const mappings = [...mediaMigration.matchAll(/\('JTS-[^']+',\d+\)/g)];
if (mappings.length !== 53) throw new Error(`Expected 53 JTS media mappings, found ${mappings.length}`);

for (const token of [
  'file_0000000098d481f4a1baa422ec264c0d',
  "'CATALOG'",
  "'VERIFIED'",
  'No generated, synthetic, stock, or substitute imagery.',
  'refuses to publish JTS products',
  'refuses nonzero current JTS product price/stock',
]) {
  if (!mediaMigration.includes(token)) throw new Error(`Version 281 source-evidence migration missing token: ${token}`);
}

for (const token of [
  '/catalog/verified/jts/',
  'exactly 53 verified JTS catalog media records',
  'expected 53 static JTS media URLs',
  'refuses JTS BranchProductPrice rows',
  'refuses JTS WarehouseInventory rows',
]) {
  if (!staticMigration.includes(token)) throw new Error(`Version 281 static-media migration missing token: ${token}`);
}

for (const token of [
  expectedArchiveSha256,
  'expectedFilenames = [',
  'JTS-809R-METAL-SPOKE.webp',
  'JTS-PEDAL-EXERCISER.webp',
  "'RIFF'",
  "'WEBP'",
  "tar', ['-xzf'",
  'public/catalog/verified/jts',
]) {
  if (!prepare.includes(token)) throw new Error(`Version 281 preparation script missing token: ${token}`);
}

const combined = `${mediaMigration}\n${staticMigration}`.toLowerCase();
const forbiddenWrites = [
  /insert\s+into\s+public\."branchproductprice"/,
  /update\s+public\."branchproductprice"/,
  /delete\s+from\s+public\."branchproductprice"/,
  /insert\s+into\s+public\."warehouseinventory"/,
  /update\s+public\."warehouseinventory"/,
  /delete\s+from\s+public\."warehouseinventory"/,
  /insert\s+into\s+public\."order"/,
  /update\s+public\."product"\s+set\s+"ispublished"\s*=\s*true/,
];
for (const pattern of forbiddenWrites) {
  if (pattern.test(combined)) throw new Error(`Version 281 must not mutate current commerce/publication data: ${pattern}`);
}

console.log(`Version 281 JTS verified-media completion audit passed: 53 exact source mappings, checksum-pinned static bundle ${archiveSha256}, exact filename manifest, fail-closed commerce.`);
