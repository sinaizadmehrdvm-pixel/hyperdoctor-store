import type { BuilderDocument, BuilderLocale } from "@/lib/page-builder";
import { defaultBuilderTheme } from "@/lib/page-builder";
import { SectionRenderer } from "@/components/page-builder/section-renderer";

export function PageBuilderDocumentRenderer({document,locale}:{document:BuilderDocument;locale:BuilderLocale}){
  const theme={...defaultBuilderTheme,...(document.theme||{})};
  const scale=theme.fontScale==="lg"?"1.075":theme.fontScale==="sm"?".94":"1";
  return <main className="flex-1" style={{background:theme.pageBackground,color:theme.foreground,fontSize:`calc(1rem * ${scale})`}}>
    <div style={{display:"grid",gap:`${Math.max(0,Math.min(Number(theme.sectionGap||0),160))}px`}}>
      {document.sections.map(section=><SectionRenderer key={section.id} section={section} locale={locale}/>) }
    </div>
  </main>;
}
