import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, renameSync } from "node:fs";
import { join, resolve } from "node:path";

const archivePath = resolve("assets/catalog/v285/catalog-enrichment-v285-media-240q85.tar.gz");
const manifestPath = resolve("assets/catalog/v285/source-derived-manifest.json");
const targetDir = resolve("public/catalog/verified/v285");
const expectedArchiveName = "catalog-enrichment-v285-media-240q85.tar.gz";
const expectedArchiveSha256 = "8da7b80946989d80778aba8942ad4a6c7cf2f2b8e5980b36273650d308f30b4f";

if (!existsSync(archivePath) || !existsSync(manifestPath)) throw new Error("Missing Version 285 verified-media bundle");
const archive = readFileSync(archivePath);
const archiveSha256 = createHash("sha256").update(archive).digest("hex");
if (archiveSha256 !== expectedArchiveSha256) throw new Error(`Version 285 archive checksum mismatch: ${archiveSha256}`);

const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as {
  version: number;
  archive: string;
  archiveSha256: string;
  files: number;
  assets: Array<{
    sku: string;
    filename: string;
    byteSize: number;
    sha256: string;
    width: number;
    height: number;
    sourceFileId: string;
    sourcePage: number;
    sourceModel: string;
    visualScope: string;
  }>;
};
if (
  manifest.version !== 285 ||
  manifest.archive !== expectedArchiveName ||
  manifest.archiveSha256 !== archiveSha256 ||
  manifest.files !== 117 ||
  manifest.assets.length !== 117
) {
  throw new Error("Version 285 manifest/archive metadata mismatch");
}
const filenames = manifest.assets.map((asset) => asset.filename).sort();
if (new Set(filenames).size !== 117) throw new Error("Version 285 manifest contains duplicate filenames");
if (manifest.assets.filter((asset) => asset.sku.startsWith("BW-")).length !== 50) throw new Error("Version 285 B.Well media count mismatch");
if (manifest.assets.filter((asset) => asset.sku.startsWith("HOO-")).length !== 43) throw new Error("Version 285 Hooshmand media count mismatch");
if (manifest.assets.filter((asset) => asset.sku.startsWith("EGT-")).length !== 24) throw new Error("Version 285 EGT media count mismatch");
if (manifest.assets.filter((asset) => asset.visualScope === "OFFICIAL_FAMILY_VISUAL").length !== 11) throw new Error("Version 285 EGT family-visual count mismatch");
if (manifest.assets.filter((asset) => asset.visualScope === "EXACT_PRODUCT_VISUAL").length !== 106) throw new Error("Version 285 exact-product visual count mismatch");

const archiveEntries = execFileSync("tar", ["-tzf", archivePath], { encoding: "utf8" }).trim().split("\n").sort();
if (archiveEntries.join("\n") !== filenames.join("\n")) throw new Error("Version 285 archive filename manifest mismatch");

mkdirSync(resolve("public/catalog/verified"), { recursive: true });
const staging = mkdtempSync(resolve("public/catalog/verified/.v285-staging-"));
try {
  execFileSync("tar", ["-xzf", archivePath, "-C", staging], { stdio: "inherit" });
  const files = readdirSync(staging).sort();
  if (files.join("\n") !== filenames.join("\n")) throw new Error("Version 285 extracted file set mismatch");
  for (const asset of manifest.assets) {
    const bytes = readFileSync(join(staging, asset.filename));
    if (bytes.length !== asset.byteSize) throw new Error(`Version 285 byte-size mismatch: ${asset.filename}`);
    if (createHash("sha256").update(bytes).digest("hex") !== asset.sha256) throw new Error(`Version 285 checksum mismatch: ${asset.filename}`);
    if (asset.width !== 240 || asset.height !== 240) throw new Error(`Version 285 dimensions mismatch: ${asset.filename}`);
    if (bytes.length < 12 || bytes.subarray(0, 4).toString("ascii") !== "RIFF" || bytes.subarray(8, 12).toString("ascii") !== "WEBP") {
      throw new Error(`Version 285 asset is not WEBP: ${asset.filename}`);
    }
  }
  rmSync(targetDir, { recursive: true, force: true });
  renameSync(staging, targetDir);
  console.log(`Prepared ${files.length} Version 285 source-derived storefront media files; archive sha256=${archiveSha256}.`);
} finally {
  rmSync(staging, { recursive: true, force: true });
}
