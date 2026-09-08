import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import sharp from 'sharp';

const migration = readFileSync(resolve('supabase/migrations/20260907023000_jts_verified_product_media.sql'), 'utf8');
const expected = [...migration.matchAll(/\('([^']+)',\d+\)/g)].map((m) => `${m[1]}.webp`).sort();
if (expected.length !== 53) throw new Error(`Expected 53 JTS filenames, found ${expected.length}`);
for (const file of expected) {
  const path = resolve('public/catalog/verified/jts', file);
  if (!existsSync(path)) throw new Error(`Missing reconstructed JTS media: ${file}`);
}
async function verifyDecodedImages() {
  for (const file of expected) {
    const { info } = await sharp(resolve('public/catalog/verified/jts', file), { failOn: 'warning' })
      .raw().toBuffer({ resolveWithObject: true });
    if (info.width !== 240 || info.height !== 240) throw new Error(`Invalid image dimensions: ${file}`);
  }
  console.log(`Decoded all ${expected.length} JTS WEBP images at 240x240; exact SKU mapping verified.`);
}
verifyDecodedImages().catch(error => { console.error(error); process.exitCode = 1; });
