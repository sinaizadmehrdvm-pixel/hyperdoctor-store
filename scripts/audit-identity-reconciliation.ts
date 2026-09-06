import fs from "node:fs";

const map=fs.readFileSync("src/lib/catalog-master-packs/internal-sku-reconciliation.ts","utf8");
const migration=fs.readFileSync("supabase/migrations/20260906235500_catalog_identity_suggestions_manifest.sql","utf8");
const actions=fs.readFileSync("src/app/admin/(protected)/products/staging/actions.ts","utf8");
const manifest=fs.readFileSync("src/app/admin/(protected)/products/identity-manifest/page.tsx","utf8");
const expected=["HD-4-P-120001","HD-4-P-120003","HD-4-P-120004","HD-4-P-120005"];
for(const sku of expected){if(!map.includes(sku))throw new Error(`reconciliation mapping missing ${sku}`)}
if((map.match(/suggestedSiteSku:/g)||[]).length!==4)throw new Error("reconciliation suggestions must remain deliberately limited to four high-confidence matches");
if(/price|stock/i.test(map.replace(/never carry price\/stock/i,"")))throw new Error("identity reconciliation map must not carry commerce data");
for(const token of ["suggestedSiteSku","identityEvidence","admin_catalog_staging_set_suggestion","admin_catalog_staging_identity_manifest"]){if(!migration.includes(token))throw new Error(`identity manifest migration missing ${token}`)}
if(!actions.includes("confirmationRequired:true")||!actions.includes("commerceDataUsed:false"))throw new Error("suggestions are not explicitly marked confirmation-only/non-commerce");
if(!manifest.includes("confirmSuggestedSiteSku"))throw new Error("identity manifest does not require explicit admin confirmation");
console.log("identity reconciliation and manifest audit passed");
