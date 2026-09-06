import fs from "node:fs";
const m=fs.readFileSync("supabase/migrations/20260907001500_legacy_catalog_identity_registry.sql","utf8");
const page=fs.readFileSync("src/app/admin/(protected)/products/staging/[id]/identity/[itemId]/page.tsx","utf8");
for(const token of ["LegacyCatalogProductIdentity","admin_legacy_catalog_identity_search","admin_catalog_staging_identity_suggestions","REFERENCE","historicalSellingPrice","revoke all"]){if(!m.includes(token))throw new Error(`legacy identity token missing: ${token}`)}
if(/BranchProductPrice|WarehouseInventory/.test(m))throw new Error("legacy registry must not write current commerce tables");
if(!page.includes("setStagingSiteSku")||!page.includes("historicalSellingPrice"))throw new Error("identity resolver must require explicit SKU selection and label historical commerce");
console.log("legacy identity registry audit passed");
