import { readFileSync } from "node:fs";

function mustInclude(file:string,needles:string[]){const text=readFileSync(file,"utf8");for(const needle of needles){if(!text.includes(needle))throw new Error(`${file}: missing launch/commerce guard ${needle}`)}}
function mustEqual(file:string,expected:string){const text=readFileSync(file,"utf8");if(text!==expected)throw new Error(`${file}: template must remain headers-only`)}

mustInclude("supabase/migrations/20260906194500_current_commerce_import_and_launch_publish_gate.sql",[
  '"CommerceSource"',
  '"CommerceDataEvidence"',
  "admin_commerce_import_preflight",
  "admin_commerce_import_apply",
  "VARIANT_PRODUCT_REQUIRES_VARIANT_WORKFLOW",
  "admin_catalog_launch_readiness",
  "SOURCE_EVIDENCE_MISSING",
  "IMAGE_MISSING",
  "PRICE_MISSING",
  "STOCK_MISSING",
  "admin_publish_catalog_ready_products",
  "grant execute on function public.admin_publish_catalog_ready_products",
]);
mustInclude("src/app/api/admin/commerce/import/route.ts",["admin_commerce_import_preflight","admin_commerce_import_apply","Only CSV and XLSX files are supported"]);
mustInclude("src/app/admin/(protected)/products/launch/page.tsx",["admin_catalog_launch_readiness","readyToPublish","Publish all ready"]);
mustInclude("src/app/admin/(protected)/products/launch/actions.ts",["admin_publish_catalog_ready_products"]);
mustEqual("public/templates/commerce-import-template.csv","sku,price,compareAtPrice,onHand\n");
console.log("Launch commerce audit passed: current-data provenance, preflight and guarded publish are wired");
