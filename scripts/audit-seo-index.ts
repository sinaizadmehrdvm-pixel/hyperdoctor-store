import fs from "node:fs";

const migration=fs.readFileSync("supabase/migrations/20260906214500_public_seo_index_v265.sql","utf8");
const sitemap=fs.readFileSync("src/app/sitemap.ts","utf8");
const robots=fs.readFileSync("src/app/robots.ts","utf8");
const config=fs.readFileSync("next.config.ts","utf8");
for(const token of ["public_seo_index_v1","Product","Article","Page","isPublished","service_role"]){if(!migration.includes(token))throw new Error(`SEO migration missing ${token}`)}
for(const bad of ["grant execute on function public.public_seo_index_v1() to anon","grant execute on function public.public_seo_index_v1() to authenticated"]){if(migration.toLowerCase().includes(bad.toLowerCase()))throw new Error("SEO index must stay service-role-only")}
for(const token of ["fa","tr","en","ar","/product/","/articles/","public_seo_index_v1"]){if(!sitemap.includes(token))throw new Error(`sitemap missing ${token}`)}
for(const token of ["/admin/","/api/","/preview/","/checkout","/account/","sitemap.xml"]){if(!robots.includes(token))throw new Error(`robots missing ${token}`)}
for(const token of ["image/avif","image/webp","minimumCacheTTL","poweredByHeader"]){if(!config.includes(token))throw new Error(`next config missing ${token}`)}
console.log("SEO + delivery audit: OK");
