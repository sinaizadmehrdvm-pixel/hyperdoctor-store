import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const release = JSON.parse(readFileSync("docs/releases/version-285-catalog-enrichment.json","utf8")) as any;
const sourceManifest = JSON.parse(readFileSync("assets/catalog/v285/source-derived-manifest.json","utf8")) as any;
const migration = readFileSync("supabase/migrations/20260912165000_catalog_enrichment_v285.sql","utf8");
const prepare = readFileSync("scripts/prepare-v285-verified-media.ts","utf8");

if (release.version !== 285 || release.releaseDecision !== "ENRICHMENT_COMPLETE_FAIL_CLOSED_COMMERCE") throw new Error("Version 285 release metadata mismatch");
if (release.catalog.products !== 170 || release.catalog.fourLanguageDescriptionProducts !== 170 || release.catalog.productsWithVerifiedMedia !== 170) throw new Error("Version 285 completion snapshot mismatch");
if (release.catalog.productsMissingVerifiedMedia !== 0 || release.remainingBlockers.descriptionWarnings !== 0) throw new Error("Version 285 content gaps must be closed");
if (release.catalog.productsWithCurrentBranchPrice !== 0 || release.catalog.productsWithAvailableInventory !== 0 || release.catalog.publishReadyProducts !== 0 || release.catalog.publishedProducts !== 0) throw new Error("Version 285 must remain fail-closed for commerce/publication");
if (release.delta.fourLanguageDescriptionsAdded !== 23 || release.delta.verifiedMediaAdded !== 117 || release.delta.exactProductVisualsAdded !== 106 || release.delta.officialFamilyVisualsAdded !== 11) throw new Error("Version 285 delta mismatch");

if (sourceManifest.version !== 285 || sourceManifest.archive !== "catalog-enrichment-v285-media-240q85.tar.gz" || sourceManifest.archiveSha256 !== "8da7b80946989d80778aba8942ad4a6c7cf2f2b8e5980b36273650d308f30b4f" || sourceManifest.files !== 117 || sourceManifest.assets.length !== 117) throw new Error("Version 285 source manifest count/archive mismatch");
const partNames = readdirSync("assets/catalog/v285/archive.parts").filter((name:string)=>name.endsWith(".b64")).sort();
if (partNames.length !== 8) throw new Error(`Version 285 expected 8 archive parts, found ${partNames.length}`);
const archive = Buffer.from(partNames.map((name:string)=>readFileSync(join("assets/catalog/v285/archive.parts",name),"utf8").trim()).join(""),"base64");
if (createHash("sha256").update(archive).digest("hex") !== sourceManifest.archiveSha256) throw new Error("Version 285 reconstructed archive checksum mismatch");
const assets = [...sourceManifest.assets].sort((a:any,b:any)=>a.sku.localeCompare(b.sku));
const assetSetPayload = assets.map((a:any)=>`${a.sku}:${a.sha256}:${a.byteSize}:${a.sourceFileId}:${a.sourcePage}:${a.sourceModel}:${a.visualScope}`).join("\n");
const assetSetSha = createHash("sha256").update(assetSetPayload).digest("hex");
if (assetSetSha !== "9361ab2f6c9c65e83559b4954d38ea876a7b414463180062ce00820aadcc5471" || sourceManifest.assetSetSha256 !== assetSetSha || release.mediaBundle.assetSetSha256 !== assetSetSha) throw new Error("Version 285 asset-set checksum mismatch");

const skus = assets.map((a:any)=>a.sku);
if (new Set(skus).size !== 117) throw new Error("Version 285 manifest contains duplicate SKUs");
if (skus.filter((s:string)=>s.startsWith("BW-")).length !== 50 || skus.filter((s:string)=>s.startsWith("HOO-")).length !== 43 || skus.filter((s:string)=>s.startsWith("EGT-")).length !== 24) throw new Error("Version 285 brand media count mismatch");
if (assets.filter((a:any)=>a.visualScope==="EXACT_PRODUCT_VISUAL").length !== 106 || assets.filter((a:any)=>a.visualScope==="OFFICIAL_FAMILY_VISUAL").length !== 11) throw new Error("Version 285 visual-scope count mismatch");
for (const a of assets) {
  if (!a.sourceFileId || !Number.isInteger(a.sourcePage) || a.sourcePage < 1 || !a.sourceModel || !/^[0-9a-f]{64}$/.test(a.sha256) || a.width!==240 || a.height!==240 || a.byteSize<=0) throw new Error(`Invalid Version 285 asset provenance: ${a.sku}`);
  if (!migration.includes(`('${a.sku}','${a.sourceFileId}',${a.sourcePage},'${a.visualScope}')`)) throw new Error(`Version 285 migration missing exact source mapping: ${a.sku}`);
}

const blocked = ["HOO-COOLER-CLASSIC","HOO-COOLER-WAVE-L","HOO-COOLER-WAVE-XL","HOO-SLEEP-NECK","HOO-WAVE-MASSAGER"].sort();
if ([...release.blockedStagingSkus].sort().join("\n") !== blocked.join("\n")) throw new Error("Version 285 blocked Hooshmand SKU set changed");
for (const sku of blocked) {
  if (skus.includes(sku)) throw new Error(`Blocked Hooshmand SKU must not receive inferred media: ${sku}`);
  if (!migration.includes(sku)) throw new Error(`Migration does not preserve blocked SKU: ${sku}`);
}

for (const token of [
  "Version 285 — Catalog Enrichment & Launch Readiness",
  "expected exactly 23 B.Well description gaps",
  "expected exactly 117 source-derived v285 target media rows",
  "expected 170/170 complete four-language descriptions",
  "expected 170/170 Product Master rows with verified media",
  "version-285-source-derived-media"
]) if (!migration.includes(token)) throw new Error(`Version 285 migration missing token: ${token}`);

if ((migration.match(/\('BW-[^']+','/g) ?? []).length < 23) throw new Error("Version 285 migration is missing B.Well description rows");
if (!migration.includes("'media-v285-'||lower(p.sku)")) throw new Error("Version 285 migration is missing deterministic media ID generation");
const mappedRows = migration.match(/\('(?:BW|HOO|EGT)-[^']+','file_[0-9a-f]+',\d+,'(?:EXACT_PRODUCT_VISUAL|OFFICIAL_FAMILY_VISUAL)'\)/g) ?? [];
if (mappedRows.length !== 117) throw new Error(`Version 285 migration expected 117 source media rows, found ${mappedRows.length}`);

const lower = migration.toLowerCase();
for (const pattern of [
  /insert\s+into\s+public\."branchproductprice"/,
  /update\s+public\."branchproductprice"/,
  /insert\s+into\s+public\."warehouseinventory"/,
  /update\s+public\."warehouseinventory"/,
  /insert\s+into\s+public\."order"/,
  /"ispublished"\s*=\s*true/,
]) if (pattern.test(lower)) throw new Error(`Version 285 must not mutate live commerce/publication: ${pattern}`);

if (!migration.includes("/catalog/verified/v285/")) throw new Error("Version 285 migration is missing immutable static media URLs");
if (!prepare.includes(sourceManifest.archiveSha256) || !prepare.includes("public/catalog/verified/v285") || !prepare.includes("Version 285 asset is not WEBP")) throw new Error("Version 285 deterministic media preparation is incomplete");

console.log(`Version 285 catalog enrichment audit passed: 23 descriptions, 117 source-derived media mappings, asset-set ${assetSetSha}, 170/170 media+descriptions, commerce remains fail-closed.`);
