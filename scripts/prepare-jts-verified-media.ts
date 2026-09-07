import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const archiveB64Path = resolve('assets/catalog/jts-v281/jts-v281-media-300q15.tar.gz.b64');
const targetDir = resolve('public/catalog/verified/jts');
const expectedArchiveSha256 = '37a12bf9869eeabe4363d770d924819ec2eff9e57add134515df56e10fc4531d';
const expectedFiles = 53;

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
if (files.length !== expectedFiles) throw new Error(`Expected ${expectedFiles} JTS media files, found ${files.length}`);

for (const name of files) {
  const bytes = readFileSync(join(targetDir, name));
  if (bytes.length < 500) throw new Error(`JTS media file is unexpectedly small: ${name}`);
  if (bytes.subarray(0, 4).toString('ascii') !== 'RIFF' || bytes.subarray(8, 12).toString('ascii') !== 'WEBP') {
    throw new Error(`JTS media file is not a valid WEBP container: ${name}`);
  }
}

console.log(`Prepared ${files.length} verified JTS storefront media files; archive sha256=${archiveSha256}.`);
