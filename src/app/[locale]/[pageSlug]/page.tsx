import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import { Container } from "@/components/ui/container";
import { PageBuilderDocumentRenderer } from "@/components/page-builder/document-renderer";
import { getPageBySlug } from "@/lib/queries";
import { supabaseRpc } from "@/lib/supabase-rest";
import type { BuilderDocument, BuilderLocale } from "@/lib/page-builder";

type PublicBuilderResult={page:{id:string;slug:string;titleFa:string;titleTr:string;titleEn:string;titleAr:string;template:string};document:BuilderDocument;publishedAt?:string;revision:number};

export default async function CmsPage({params}:{params:Promise<{pageSlug:string}>}) {
  const { pageSlug } = await params;
  const locale = (await getLocale()) as BuilderLocale;
  const [page,builder] = await Promise.all([
    getPageBySlug(pageSlug),
    supabaseRpc<PublicBuilderResult|null>("public_page_builder",{p_slug:pageSlug}).catch(()=>null),
  ]);
  if (!page) notFound();

  if(builder?.document?.sections?.length){
    return <PageBuilderDocumentRenderer document={builder.document} locale={locale}/>;
  }

  const title = locale === "fa" ? page.titleFa : locale === "tr" ? page.titleTr : locale === "ar" ? page.titleAr : page.titleEn;
  const content = locale === "fa" ? page.contentFa : locale === "tr" ? page.contentTr : locale === "ar" ? page.contentAr : page.contentEn;

  return (
    <main className="flex-1 py-12">
      <Container className="max-w-3xl">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{title}</h1>
        <div className="prose prose-slate mt-8 max-w-none prose-headings:font-bold prose-a:text-primary" dangerouslySetInnerHTML={{ __html: content }} />
      </Container>
    </main>
  );
}
