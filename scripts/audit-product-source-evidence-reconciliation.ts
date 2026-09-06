import fs from "node:fs";

const migrationPath = "supabase/migrations/20260907004500_product_source_evidence_reconciliation.sql";
const sql = fs.readFileSync(migrationPath, "utf8");

for (const token of [
  '"ProductSourceEvidence"',
  '"ProductAssetEvidence"',
  '"CatalogAsset"',
  '"CatalogSource"',
  '"CatalogStagingItem"',
  "VERIFIED_CATALOG_ASSET",
  "REFERENCE_ONLY",
  "on conflict (\"productId\", \"sourceId\") do nothing",
]) {
  if (!sql.includes(token)) throw new Error(`Version 280 migration token missing: ${token}`);
}

for (const forbidden of [
  'insert into public."BranchProductPrice"',
  'insert into public."WarehouseInventory"',
  'update public."Product"',
  'insert into public."Media"',
  'insert into public."ProductMediaEvidence"',
]) {
  if (sql.toLowerCase().includes(forbidden.toLowerCase())) {
    throw new Error(`Version 280 must not write current commerce/media state: ${forbidden}`);
  }
}

if (!sql.includes("a.\"verificationStatus\" = 'VERIFIED'")) {
  throw new Error("Version 280 must require VERIFIED catalog assets");
}
if (!sql.includes("s.status = 'CONFIRMED'")) {
  throw new Error("Version 280 must require CONFIRMED catalog sources");
}
if (!sql.includes("pae.role in ('PRIMARY_SOURCE', 'TECHNICAL_PAGE')")) {
  throw new Error("Version 280 must only reconcile technical source evidence");
}

console.log("product source evidence reconciliation audit passed");
