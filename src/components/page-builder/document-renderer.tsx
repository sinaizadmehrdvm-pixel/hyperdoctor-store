import type { BuilderDocument, BuilderLocale } from "@/lib/page-builder";
import { SectionRenderer } from "@/components/page-builder/section-renderer";

export function PageBuilderDocumentRenderer({document,locale}:{document:BuilderDocument;locale:BuilderLocale}){
  return <main className="flex-1">{document.sections.map(section=><SectionRenderer key={section.id} section={section} locale={locale}/>)}</main>;
}
