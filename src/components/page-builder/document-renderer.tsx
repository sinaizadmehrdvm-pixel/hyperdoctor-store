import type { CSSProperties } from "react";
import type { BuilderDocument, BuilderLocale } from "@/lib/page-builder";
import { defaultBuilderTheme } from "@/lib/page-builder";
import { SectionRenderer } from "@/components/page-builder/section-renderer";

type ThemeStyle = CSSProperties & {
  "--builder-surface": string;
  "--builder-foreground": string;
  "--builder-accent": string;
  "--builder-muted": string;
  "--builder-radius": string;
};

export function PageBuilderDocumentRenderer({document,locale}:{document:BuilderDocument;locale:BuilderLocale}){
  const theme={...defaultBuilderTheme,...(document.theme||{})};
  const scale=theme.fontScale==="lg"?"1.075":theme.fontScale==="sm"?".94":"1";
  const radius=`${Math.max(0,Math.min(Number(theme.radius||24),80))}px`;
  const style:ThemeStyle={
    background:theme.pageBackground,
    color:theme.foreground,
    fontSize:`calc(1rem * ${scale})`,
    "--builder-surface":theme.surface||"#ffffff",
    "--builder-foreground":theme.foreground||"#001736",
    "--builder-accent":theme.accent||"#e80346",
    "--builder-muted":theme.muted||"#667085",
    "--builder-radius":radius,
  };
  return <main className="flex-1" style={style}>
    <div style={{display:"grid",gap:`${Math.max(0,Math.min(Number(theme.sectionGap||0),160))}px`}}>
      {document.sections.map(section=><SectionRenderer key={section.id} section={section} locale={locale}/>) }
    </div>
  </main>;
}
