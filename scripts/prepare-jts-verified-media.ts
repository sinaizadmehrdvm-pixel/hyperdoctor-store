import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const archiveB64Path = resolve('assets/catalog/jts-v281/jts-v281-media-300q80.tar.gz.b64');
const targetDir = resolve('public/catalog/verified/jts');
const expectedArchiveSha256 = '8bccad6d57f3423d009d4704ce66f0bfdcee57b5996baecd2591398ac26a0aa1';
const expectedFilenames = [
  'JTS-105.webp',
  'JTS-1120.webp',
  'JTS-112A.webp',
  'JTS-117L.webp',
  'JTS-411-LAJ.webp',
  'JTS-413-LAJ.webp',
  'JTS-602LGC.webp',
  'JTS-608GC.webp',
  'JTS-608L.webp',
  'JTS-681.webp',
  'JTS-695L.webp',
  'JTS-695U.webp',
  'JTS-695Z.webp',
  'JTS-809A.webp',
  'JTS-809B.webp',
  'JTS-809C.webp',
  'JTS-809E.webp',
  'JTS-809P.webp',
  'JTS-809R-12.webp',
  'JTS-809R-16.webp',
  'JTS-809R-METAL-SPOKE.webp',
  'JTS-809R.webp',
  'JTS-863-12E.webp',
  'JTS-863-20E.webp',
  'JTS-863LA-12.webp',
  'JTS-874A.webp',
  'JTS-874B.webp',
  'JTS-874C.webp',
  'JTS-901A.webp',
  'JTS-901B.webp',
  'JTS-901B55.webp',
  'JTS-901M.webp',
  'JTS-901MB.webp',
  'JTS-901S.webp',
  'JTS-901XS.webp',
  'JTS-908-12.webp',
  'JTS-908AQ.webp',
  'JTS-908LAJQE.webp',
  'JTS-951L.webp',
  'JTS-958-38G44.webp',
  'JTS-980AC-35.webp',
  'JTS-CANE-DERBY.webp',
  'JTS-CANE-QUAD.webp',
  'JTS-CRUTCH-AXILLARY.webp',
  'JTS-PEDAL-EXERCISER.webp',
  'JTS-PEDIATRIC-WALKER-2W.webp',
  'JTS-ROLLATOR-FOOTREST.webp',
  'JTS-ROLLATOR.webp',
  'JTS-WALKER-2W-SEAT.webp',
  'JTS-WALKER-ALUMINIUM-WHEELED.webp',
  'JTS-WALKER-ALUMINIUM.webp',
  'JTS-WALKER-STEEL-WHEELED.webp',
  'JTS-WALKER-STEEL.webp',
].sort();

if (!existsSync(archiveB64Path)) throw new Error(`Missing canonical JTS media archive: ${archiveB64Path}`);
const encoded = readFileSync(archiveB64Path, 'utf8').replace(/\s+/g, '');
const archive = Buffer.from(encoded, 'base64');
const archiveSha256 = createHash('sha256').update(archive).digest('hex');
if (archiveSha256 !== expectedArchiveSha256) {
  throw new Error(`JTS media archive checksum mismatch: ${archiveSha256}`);
}

rmSync(targetDir, { recursive: true, force: true });
mkdirSync(targetDir, { recursive: true });
const archivePath = join(tmpdir(), `hyperdoctor-jts-v281-${process.pid}.tar.gz`);
writeFileSync(archivePath, archive);
try {
  execFileSync('tar', ['-xzf', archivePath, '-C', targetDir], { stdio: 'inherit' });
} finally {
  rmSync(archivePath, { force: true });
}

const files = readdirSync(targetDir).filter((name) => /^JTS-.+\.webp$/.test(name)).sort();
if (files.length !== expectedFilenames.length) {
  throw new Error(`Expected ${expectedFilenames.length} JTS media files, found ${files.length}`);
}
if (files.join('\n') !== expectedFilenames.join('\n')) {
  const missing = expectedFilenames.filter((name) => !files.includes(name));
  const unexpected = files.filter((name) => !expectedFilenames.includes(name));
  throw new Error(`JTS media filename manifest mismatch; missing=[${missing.join(', ')}], unexpected=[${unexpected.join(', ')}]`);
}

for (const name of files) {
  const bytes = readFileSync(join(targetDir, name));
  if (bytes.length < 500) throw new Error(`JTS media file is unexpectedly small: ${name}`);
  if (bytes.subarray(0, 4).toString('ascii') !== 'RIFF' || bytes.subarray(8, 12).toString('ascii') !== 'WEBP') {
    throw new Error(`JTS media file is not a valid WEBP container: ${name}`);
  }
}

console.log(`Prepared ${files.length} verified JTS storefront media files; archive sha256=${archiveSha256}.`);
