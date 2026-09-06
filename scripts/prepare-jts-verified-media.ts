import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const partsDir = resolve('assets/catalog/jts-v281');
const targetDir = resolve('public/catalog/verified/jts');
const expectedArchiveSha256 = '8e143d452b03e5638d6d03519377469d3ded854af7f5c03f842ed0bf10914b11';
const expectedFiles = 53;

if (!existsSync(partsDir)) throw new Error(`Missing verified JTS media bundle parts: ${partsDir}`);

const parts = readdirSync(partsDir).filter((name) => /^part-\d{2}\.b64$/.test(name)).sort();
if (parts.length !== 10) throw new Error(`Expected 10 JTS media bundle parts, found ${parts.length}`);

const encoded = parts.map((name) => readFileSync(join(partsDir, name), 'utf8').trim()).join('');
const archive = Buffer.from(encoded, 'base64');
const sha256 = createHash('sha256').update(archive).digest('hex');
if (sha256 !== expectedArchiveSha256) throw new Error(`JTS media archive checksum mismatch: ${sha256}`);

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
if (files.length !== expectedFiles) throw new Error(`Expected ${expectedFiles} extracted JTS media files, found ${files.length}`);
for (const name of files) {
  const bytes = readFileSync(join(targetDir, name));
  if (bytes.length < 1000) throw new Error(`JTS media file is unexpectedly small: ${name}`);
  if (bytes.subarray(0, 4).toString('ascii') !== 'RIFF' || bytes.subarray(8, 12).toString('ascii') !== 'WEBP') {
    throw new Error(`JTS media file is not a valid WEBP container: ${name}`);
  }
}

console.log(`Prepared ${files.length} source-derived JTS verified media files.`);
