import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageBuilderDocumentRenderer } from "@/components/page-builder/document-renderer";
import { supabaseRpc } from "@/lib/supabase-rest";
import { normalizeDocument, type BuilderDocument, type BuilderLocale } from "@/lib/page-builder";

type PreviewBundle={page:{id:string;slug:string;titleFa:string;titleTr:string;titleEn:string;titleAr:string;template:string};document:BuilderDocument;expiresAt:string};
const locales=new Set<BuilderLocale>(["fa","tr","en","ar"]);

export const dynamic="force-dynamic";
export const metadata:Metadata={robots:{index:false,follow:false},title:"Draft preview · Hyper Doctor"};

export default async function SecureBuilderPreview({params}:{params:Promise<{token:string;locale:string}>}){
  const {token,locale:rawLocale}=await params;
  if(!locales.has(rawLocale as BuilderLocale))notFound();
  const locale=rawLocale as BuilderLocale;
  let bundle:PreviewBundle|null=null;
  try{bundle=await supabaseRpc<PreviewBundle|null>("public_builder_preview",{p_preview_token:token});}catch{return notFound();}
  if(!bundle?.document)notFound();
  const rtl=locale==="fa"||locale==="ar";
  const title=locale==="fa"?bundle.page.titleFa:locale==="tr"?bundle.page.titleTr:locale==="ar"?bundle.page.titleAr:bundle.page.titleEn;
  return <div className="min-h-screen bg-white" dir={rtl?"rtl":"ltr"}>
    <div className="sticky top-0 z-[70] flex flex-wrap items-center justify-between gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-950 shadow-sm"><div className="font-black">DRAFT PREVIEW · {title||bundle.page.slug}</div><div>Expires {new Date(bundle.expiresAt).toLocaleString()}</div></div>
    <PageBuilderDocumentRenderer document={normalizeDocument(bundle.document)} locale={locale}/>
  </div>;
}
