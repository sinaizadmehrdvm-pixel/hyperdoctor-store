import fs from "node:fs";

const migration=fs.readFileSync("supabase/migrations/20260906233000_catalog_site_sku_identity_gate.sql","utf8");
const actions=fs.readFileSync("src/app/admin/(protected)/products/staging/actions.ts","utf8");
const page=fs.readFileSync("src/app/admin/(protected)/products/staging/[id]/page.tsx","utf8");

const must=[
  '"siteSku"',
  '"identityStatus"',
  'site_sku_unverified',
  'admin_catalog_staging_set_site_sku',
  'verified Hyper Doctor site SKU is required before promotion',
  "revoke all on function public.admin_catalog_staging_set_site_sku(text,text,text) from public, anon, authenticated",
  "grant execute on function public.admin_catalog_staging_set_site_sku(text,text,text) to service_role"
];
for(const token of must){if(!migration.includes(token))throw new Error(`site SKU identity migration missing: ${token}`)}
if(!actions.includes("setStagingSiteSku"))throw new Error("staging site SKU server action missing");
if(!page.includes("identityStatus")||!page.includes("setStagingSiteSku"))throw new Error("staging identity review UI missing");
if(!migration.includes("v_payload:=v_payload-'sku'"))throw new Error("source SKU is still implicitly promoted as site SKU");
console.log("site SKU identity gate audit passed");
