import fs from "node:fs";

const migration=fs.readFileSync("supabase/migrations/20260906212000_launch_operations_summary_v263.sql","utf8");
const page=fs.readFileSync("src/app/admin/(protected)/launch-ops/page.tsx","utf8");
const permissions=fs.readFileSync("src/lib/admin-permissions.ts","utf8");
const required=[
  "admin_launch_operations_summary",
  "ProductMediaEvidence",
  "ProductSourceEvidence",
  "BranchProductPrice",
  "WarehouseInventory",
  "CommerceDataEvidence",
  "revoke all on function public.admin_launch_operations_summary(text) from public, anon, authenticated",
  "grant execute on function public.admin_launch_operations_summary(text) to service_role"
];
for(const token of required) if(!migration.includes(token)) throw new Error(`launch ops migration missing ${token}`);
if(!permissions.includes('"admin_launch_operations_summary"')) throw new Error("launch ops RPC is not authorized for editor workflow");
for(const token of ["SUPABASE_SERVICE_ROLE_KEY","ZARINPAL_MERCHANT_ID","ZARINPAL_SANDBOX","NEXT_PUBLIC_SITE_URL","/admin/products/staging","/admin/products/launch","/admin/commerce"]){if(!page.includes(token))throw new Error(`launch ops page missing ${token}`)}
if(/insert\s+into\s+public\."(?:Product|Media|Order|BranchProductPrice|WarehouseInventory)"/i.test(migration)) throw new Error("launch operations migration must not seed commerce data");
console.log("launch operations audit: OK");
