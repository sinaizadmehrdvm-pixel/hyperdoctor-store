import fs from "node:fs";

const manifest = JSON.parse(fs.readFileSync("docs/releases/version-283-production-catalog-preflight.json", "utf8")) as {
  version: number;
  catalog: Record<string, number>;
  blockers: Record<string, number>;
  branch: Record<string, string | number | boolean>;
  byBrand: Array<{ brand: string; products: number; fourLanguageDescriptions: number; verifiedMedia: number; missingVerifiedMedia: number }>;
  blockedStagingSkus: string[];
  releaseDecision: string;
};
const migration = fs.readFileSync("supabase/migrations/20260912124500_catalog_launch_preflight_v283.sql", "utf8");
const page = fs.readFileSync("src/app/admin/(protected)/products/preflight/page.tsx", "utf8");
const permissions = fs.readFileSync("src/lib/admin-permissions.ts", "utf8");

if (manifest.version !== 283) throw new Error(`Expected Version 283, got ${manifest.version}`);
if (manifest.releaseDecision !== "PREFLIGHT_ONLY_NOT_READY_TO_PUBLISH") throw new Error("Version 283 must remain preflight-only and fail closed");

const c = manifest.catalog;
const exactCatalog: Record<string, number> = {
  stagingItems: 175,
  verifiedIdentities: 175,
  promotedStagingItems: 170,
  needsReviewStagingItems: 5,
  products: 170,
  sourceBackedProducts: 170,
  fourLanguageNameProducts: 170,
  fourLanguageDescriptionProducts: 147,
  productsWithVerifiedMedia: 53,
  productsMissingVerifiedMedia: 117,
  productsWithCurrentBranchPrice: 0,
  productsWithAvailableInventory: 0,
  publishReadyProducts: 0,
  publishedProducts: 0,
};
for (const [key, expected] of Object.entries(exactCatalog)) {
  if (c[key] !== expected) throw new Error(`Version 283 catalog snapshot mismatch: ${key}=${c[key]}, expected ${expected}`);
}
if (c.sourceBackedProducts !== c.products) throw new Error("Every Product Master row must remain source-backed");
if (c.fourLanguageNameProducts !== c.products) throw new Error("Every Product Master row must keep four-language names");
if (c.productsWithVerifiedMedia + c.productsMissingVerifiedMedia !== c.products) throw new Error("Verified media coverage arithmetic is inconsistent");
if (c.publishReadyProducts !== 0 || c.publishedProducts !== 0) throw new Error("Version 283 may not claim publish readiness or publication");

const blockers = manifest.blockers;
const exactBlockers: Record<string, number> = {
  sourceEvidenceMissing: 0,
  translationMissing: 0,
  verifiedMediaMissing: 117,
  variantReviewRequired: 0,
  currentPriceMissing: 170,
  availableInventoryMissing: 170,
  descriptionWarning: 23,
};
for (const [key, expected] of Object.entries(exactBlockers)) {
  if (blockers[key] !== expected) throw new Error(`Version 283 blocker mismatch: ${key}=${blockers[key]}, expected ${expected}`);
}

const brands = new Map(manifest.byBrand.map((row) => [row.brand, row]));
for (const [brand, products, descriptions, media] of [
  ["JTS", 53, 53, 53],
  ["B.Well", 50, 27, 0],
  ["Hooshmand", 43, 43, 0],
  ["EGT", 24, 24, 0],
] as const) {
  const row = brands.get(brand);
  if (!row) throw new Error(`Missing Version 283 brand snapshot: ${brand}`);
  if (row.products !== products || row.fourLanguageDescriptions !== descriptions || row.verifiedMedia !== media) {
    throw new Error(`Unexpected Version 283 ${brand} readiness snapshot`);
  }
  if (row.verifiedMedia + row.missingVerifiedMedia !== row.products) throw new Error(`${brand} media arithmetic is inconsistent`);
}
if ([...brands.values()].reduce((sum, row) => sum + row.products, 0) !== c.products) throw new Error("Brand product totals must equal Product Master total");
if ([...brands.values()].reduce((sum, row) => sum + row.verifiedMedia, 0) !== c.productsWithVerifiedMedia) throw new Error("Brand verified-media totals must equal catalog verified-media total");

const expectedBlocked = [
  "HOO-COOLER-CLASSIC",
  "HOO-COOLER-WAVE-L",
  "HOO-COOLER-WAVE-XL",
  "HOO-SLEEP-NECK",
  "HOO-WAVE-MASSAGER",
].sort();
if ([...manifest.blockedStagingSkus].sort().join("\n") !== expectedBlocked.join("\n")) throw new Error("Version 283 blocked staging SKU set changed");

for (const token of [
  "admin_catalog_launch_preflight_v283",
  "ProductSourceEvidence",
  "ProductMediaEvidence",
  "BranchProductPrice",
  "WarehouseInventory",
  "technical_source_unverified",
  "revoke all on function public.admin_catalog_launch_preflight_v283(text) from public, anon, authenticated",
  "grant execute on function public.admin_catalog_launch_preflight_v283(text) to service_role",
]) {
  if (!migration.includes(token)) throw new Error(`Version 283 migration missing ${token}`);
}
if (/insert\s+into\s+public\."(?:Product|Media|Order|BranchProductPrice|WarehouseInventory)"/i.test(migration)) {
  throw new Error("Version 283 preflight migration must not seed commerce or catalog data");
}
if (/\bupdate\s+public\."(?:Product|Media|BranchProductPrice|WarehouseInventory)"/i.test(migration)) {
  throw new Error("Version 283 preflight migration must remain read-only for catalog/commerce rows");
}
if (!permissions.includes('"admin_catalog_launch_preflight_v283"')) throw new Error("Version 283 preflight RPC is not authorized for editor workflow");
for (const token of [
  "admin_catalog_launch_preflight_v283",
  "/admin/media",
  "/admin/commerce",
  "/admin/products/staging",
  "/admin/products/launch",
  "verifiedMediaMissing",
  "priceMissing",
  "stockMissing",
  "descriptionWarning",
]) {
  if (!page.includes(token)) throw new Error(`Version 283 preflight page missing ${token}`);
}
if (page.includes("publishReadyProducts") && !page.includes("summary.publishReadyProducts")) throw new Error("Version 283 page may display readiness but must not add a publish mutation");

if (manifest.branch.code !== "IRAN" || manifest.branch.currency !== "IRT" || manifest.branch.paymentGateway !== "ZARINPAL") {
  throw new Error("Version 283 Production branch snapshot changed unexpectedly");
}
if (manifest.branch.activePricedProducts !== 0 || manifest.branch.availableProducts !== 0) {
  throw new Error("Version 283 must not claim current price or inventory coverage");
}

console.log("Version 283 production catalog preflight audit passed: 170 source-backed products, 53 with verified media, 117 media gaps, 170 current-price gaps, 170 stock gaps, 23 description warnings, 5 technical-source staging blockers, 0 publish-ready and 0 published.");
