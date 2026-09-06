import fs from "node:fs";

const path = "supabase/migrations/20260907010000_catalog_asset_provenance_promotion_guard_v279.sql";
const m = fs.readFileSync(path, "utf8");

for (const token of [
  '"CatalogAsset"',
  '"CatalogStagingItemAsset"',
  '"ProductAssetEvidence"',
  "PRICE_SOURCE",
  "INVENTORY_SOURCE",
  "REGULATORY_SOURCE",
  "admin_catalog_asset_upsert",
  "admin_catalog_staging_asset_attach",
  "admin_catalog_staging_asset_manifest",
  "admin_catalog_staging_promote_item",
  "admin_catalog_launch_readiness",
  "verified Hyper Doctor site SKU is required before promotion",
  "verified technical source asset is required before promotion",
  "v_batch.\"pricePolicy\"='HISTORICAL'",
  "v_batch.\"pricePolicy\"='CURRENT'",
  "v_batch.\"stockPolicy\"='CURRENT'",
  "'{isPublished}','false'::jsonb",
  "x.\"matchStatus\"='VERIFIED'",
  "a.\"verificationStatus\"='VERIFIED'",
  "assetProvenanceCopied",
  "enable row level security",
  "revoke all on table public.\"CatalogAsset\" from public, anon, authenticated",
  "grant all on table public.\"CatalogAsset\" to service_role",
]) {
  if (!m.includes(token)) throw new Error(`catalog provenance token missing: ${token}`);
}

for (const signature of [
  "admin_catalog_asset_upsert(text,jsonb)",
  "admin_catalog_staging_asset_attach(text,text,text,text,text,text,integer,text)",
  "admin_catalog_staging_asset_manifest(text,text)",
  "admin_catalog_staging_promote_item(text,text)",
  "admin_catalog_launch_readiness(text,text)",
]) {
  if (!m.includes(`revoke execute on function public.${signature} from public, anon, authenticated`)) {
    throw new Error(`missing service-role RPC hardening: ${signature}`);
  }
  if (!m.includes(`grant execute on function public.${signature} to service_role`)) {
    throw new Error(`missing service-role RPC grant: ${signature}`);
  }
}

if (/grant\s+execute\s+on\s+function[\s\S]{0,220}\s+to\s+(?:public|anon|authenticated)\b/i.test(m)) {
  throw new Error("Version 279 must not grant SECURITY DEFINER admin RPC execution to client roles");
}
if (/grant\s+(?:all|select|insert|update|delete)[\s\S]{0,120}\s+to\s+(?:public|anon|authenticated)\b/i.test(m)) {
  throw new Error("Version 279 private provenance tables must not be granted to client roles");
}
if (!/insert into public\."ProductAssetEvidence"[\s\S]*?x\."matchStatus"='VERIFIED'[\s\S]*?a\."verificationStatus"='VERIFIED'/m.test(m)) {
  throw new Error("product asset provenance must only copy verified staging links and verified assets");
}
if (!/v_current_price:=case when v_batch\."pricePolicy"='CURRENT'[\s\S]*?else 0 end/m.test(m)) {
  throw new Error("non-current price policy must fail closed to zero current Product.price");
}
if (!/v_current_stock:=case when v_batch\."stockPolicy"='CURRENT'[\s\S]*?else 0 end/m.test(m)) {
  throw new Error("non-current stock policy must fail closed to zero current Product.stock");
}

console.log("catalog asset provenance and promotion guard audit passed");
