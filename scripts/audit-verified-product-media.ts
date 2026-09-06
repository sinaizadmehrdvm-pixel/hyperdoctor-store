import fs from "node:fs";
import path from "node:path";

const migration=fs.readFileSync(path.join(process.cwd(),"supabase/migrations/20260906193000_verified_product_media_and_launch_gate.sql"),"utf8");
const permissions=fs.readFileSync(path.join(process.cwd(),"src/lib/admin-permissions.ts"),"utf8");
const launch=fs.readFileSync(path.join(process.cwd(),"src/app/admin/(protected)/products/launch/page.tsx"),"utf8");

const required=[
  'create table if not exists public."ProductMediaEvidence"',
  'admin_product_media_workspace',
  'admin_attach_verified_product_media',
  'admin_detach_verified_product_media',
  "VERIFIED_IMAGE_MISSING",
  '"verificationStatus"=\'VERIFIED\'',
  'grant execute on function public.admin_attach_verified_product_media',
];
for(const token of required) if(!migration.includes(token)) throw new Error(`Verified media migration guard missing: ${token}`);
for(const rpc of ["admin_product_media_workspace","admin_attach_verified_product_media","admin_detach_verified_product_media"]) if(!permissions.includes(rpc)) throw new Error(`Editor RPC allowlist missing ${rpc}`);
if(!launch.includes("VERIFIED_IMAGE_MISSING")) throw new Error("Launch UI does not surface verified-image blocker");
if(/insert\s+into\s+public\."(?:Product|Media|ProductMediaEvidence)"[\s\S]*values\s*\([^;]*sample/i.test(migration)) throw new Error("Synthetic media/product seed detected in migration");
console.log("Verified product media audit passed");
