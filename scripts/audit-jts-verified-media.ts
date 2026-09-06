import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const migrationPath = resolve('supabase/migrations/20260907023000_jts_verified_product_media.sql');
const routePath = resolve('src/app/api/catalog-media/[mediaId]/route.ts');
for (const path of [migrationPath, routePath]) {
  if (!existsSync(path)) throw new Error(`Missing Version 281 file: ${path}`);
}

const migration = readFileSync(migrationPath, 'utf8');
const route = readFileSync(routePath, 'utf8');
const mappings = [...migration.matchAll(/\('JTS-[^']+',\d+\)/g)];
if (mappings.length !== 53) throw new Error(`Expected 53 JTS media mappings, found ${mappings.length}`);

const requiredMigrationTokens = [
  'ProductMediaBlob',
  'service_verified_product_media_blob',
  'file_0000000098d481f4a1baa422ec264c0d',
  '/api/catalog-media/',
  "'CATALOG'",
  "'VERIFIED'",
  'No generated, synthetic, stock, or substitute imagery.',
  'enable row level security',
  'revoke all on table public."ProductMediaBlob" from public, anon, authenticated',
  'grant execute on function public.service_verified_product_media_blob(text) to service_role',
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

for (const token of ['supabaseServiceRpc', 'service_verified_product_media_blob', 'Buffer.from', 'Content-Type', 'Cache-Control', 'X-Content-Type-Options']) {
  if (!route.includes(token)) throw new Error(`Version 281 media route missing token: ${token}`);
}
if (!route.includes('/^media-v281-jts-')) throw new Error('Version 281 media route must restrict IDs to JTS Version 281 media');

console.log('Version 281 JTS verified-media audit passed: 53 exact source mappings, private blob storage, verified-only API, no commerce/publication writes.');
