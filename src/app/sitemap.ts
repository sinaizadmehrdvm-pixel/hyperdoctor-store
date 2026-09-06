import type { MetadataRoute } from "next";
import { supabaseRpc } from "@/lib/supabase-rest";

type Row={slug:string;updatedAt?:string|null};
type SeoIndex={products:Row[];articles:Row[];pages:Row[]};
const locales=["fa","tr","en","ar"] as const;
const staticPaths=["","shop","about","contact","services","articles","collections","faq"] as const;

function origin(){
  const raw=process.env.NEXT_PUBLIC_SITE_URL||"https://hyperdoctor-store.vercel.app";
  try{return new URL(raw).origin}catch{return "https://hyperdoctor-store.vercel.app"}
}
function safeDate(value?:string|null){const d=value?new Date(value):new Date();return Number.isNaN(d.getTime())?new Date():d}

export default async function sitemap():Promise<MetadataRoute.Sitemap>{
  const base=origin();
  let index:SeoIndex={products:[],articles:[],pages:[]};
  try{index=await supabaseRpc<SeoIndex>("public_seo_index_v1",{}) }catch(error){console.error("[sitemap] seo index unavailable",error)}
  const entries:MetadataRoute.Sitemap=[];
  for(const locale of locales){
    for(const path of staticPaths) entries.push({url:`${base}/${locale}${path?`/${path}`:""}`,changeFrequency:path===""?"daily":"weekly",priority:path===""?1:path==="shop"?0.9:0.6});
    for(const p of index.products) entries.push({url:`${base}/${locale}/product/${encodeURIComponent(p.slug)}`,lastModified:safeDate(p.updatedAt),changeFrequency:"weekly",priority:0.8});
    for(const a of index.articles) entries.push({url:`${base}/${locale}/articles/${encodeURIComponent(a.slug)}`,lastModified:safeDate(a.updatedAt),changeFrequency:"monthly",priority:0.6});
    for(const p of index.pages) entries.push({url:`${base}/${locale}/${encodeURIComponent(p.slug)}`,lastModified:safeDate(p.updatedAt),changeFrequency:"monthly",priority:0.5});
  }
  return entries;
}
