import { NextResponse } from "next/server";
import { supabaseRpc } from "@/lib/supabase-rest";
import { getZarinpalRuntimeStatus } from "@/lib/payments/zarinpal";

type SeoIndex={products:unknown[];articles:unknown[];pages:unknown[]};

export const dynamic="force-dynamic";

export async function GET(){
  const started=Date.now();
  const payment=getZarinpalRuntimeStatus();
  try{
    const index=await supabaseRpc<SeoIndex>("public_seo_index_v1",{});
    const ok=!payment.production||payment.ready;
    const response=NextResponse.json({
      ok,
      database:"ok",
      payment:{ready:payment.ready,sandbox:payment.sandbox,merchantConfigured:payment.merchantConfigured,siteUrlValid:payment.siteUrlValid,blockers:payment.blockers},
      publishedIndex:{products:index.products.length,articles:index.articles.length,pages:index.pages.length},
      latencyMs:Date.now()-started
    },{status:ok?200:503});
    response.headers.set("Cache-Control","no-store, max-age=0");
    response.headers.set("X-Content-Type-Options","nosniff");
    return response;
  }catch(error){
    console.error("[health] database probe failed",error);
    const response=NextResponse.json({
      ok:false,
      database:"unavailable",
      payment:{ready:payment.ready,sandbox:payment.sandbox,merchantConfigured:payment.merchantConfigured,siteUrlValid:payment.siteUrlValid,blockers:payment.blockers},
      latencyMs:Date.now()-started
    },{status:503});
    response.headers.set("Cache-Control","no-store, max-age=0");
    response.headers.set("X-Content-Type-Options","nosniff");
    return response;
  }
}
