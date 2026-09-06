import fs from "node:fs";

const layout=fs.readFileSync("src/app/[locale]/layout.tsx","utf8");
const health=fs.readFileSync("src/app/api/health/route.ts","utf8");
const permissions=fs.readFileSync("src/lib/admin-permissions.ts","utf8");
for(const token of ["x-default","openGraph","#main-content","Skip to main content","رفتن به محتوای اصلی","Ana içeriğe geç","الانتقال إلى المحتوى الرئيسي"]){if(!layout.includes(token))throw new Error(`locale accessibility/metadata missing ${token}`)}
for(const token of ["public_seo_index_v1","status:503","Cache-Control","no-store","database:\"ok\""]){if(!health.includes(token))throw new Error(`health probe missing ${token}`)}
if(/SUPABASE_SERVICE_ROLE_KEY|ZARINPAL_MERCHANT_ID|process\.env/.test(health)) throw new Error("public health route must not expose or inspect secret environment values");
if(!permissions.includes('EDITOR:"İçerik Editörü"'))throw new Error("Turkish editor role label regression");
console.log("runtime accessibility audit: OK");
