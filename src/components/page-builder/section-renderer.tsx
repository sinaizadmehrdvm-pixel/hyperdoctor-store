import Link from "next/link";
import type { CSSProperties, MouseEvent, ReactNode } from "react";
import type { BuilderLocale, BuilderSection, BuilderViewport } from "@/lib/page-builder";
import { localize } from "@/lib/page-builder";

type ImageTarget = { kind: "section" } | { kind: "card"; cardId: string };
type Props = {
  section: BuilderSection;
  locale: BuilderLocale;
  viewport?: BuilderViewport;
  editable?: boolean;
  selected?: boolean;
  onSelect?: () => void;
  onInlineChange?: (path: string, value: string) => void;
  onRequestImage?: (target: ImageTarget) => void;
};

const px = (value: unknown, fallback: number) => {
  const n = Number(value);
  return Number.isFinite(n) ? `${Math.max(0, Math.min(n, 2000))}px` : `${fallback}px`;
};
const accentButton: CSSProperties = { background: "var(--builder-accent, #e80346)", borderRadius: "var(--builder-radius, 12px)" };
const darkButton: CSSProperties = { background: "var(--builder-foreground, #001736)", borderRadius: "var(--builder-radius, 12px)" };
const surfaceCard: CSSProperties = { background: "var(--builder-surface, #ffffff)", borderRadius: "var(--builder-radius, 24px)" };

function EditableText({ value, editable, html = false, className, onChange, children }: { value: string; editable: boolean; html?: boolean; className?: string; onChange?: (value: string) => void; children?: ReactNode }) {
  if (!editable) return <>{children}</>;
  if (html) return <div className={`${className || ""} rounded-md outline-none focus:ring-2 focus:ring-sky-400/60`} contentEditable suppressContentEditableWarning dangerouslySetInnerHTML={{ __html: value }} onClick={e=>e.stopPropagation()} onBlur={e=>onChange?.(e.currentTarget.innerHTML)} />;
  return <span className={`${className || ""} min-w-[1ch] rounded-md outline-none focus:ring-2 focus:ring-sky-400/60`} contentEditable suppressContentEditableWarning onClick={e=>e.stopPropagation()} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();e.currentTarget.blur()}}} onBlur={e=>onChange?.(e.currentTarget.textContent || "")}>{value || " "}</span>;
}

function ReplaceableImage({ src, alt, editable, onReplace, className, placeholder = "Image" }: { src?: string; alt: string; editable: boolean; onReplace?: () => void; className: string; placeholder?: string }) {
  const stop = (e: MouseEvent) => { e.stopPropagation(); if (editable) onReplace?.(); };
  if (!src) return <button type="button" onClick={stop} className={`${className} flex items-center justify-center border-2 border-dashed border-sky-300 bg-sky-50/70 text-sm font-black text-sky-700`}>{editable ? "+ Replace image" : placeholder}</button>;
  return <div className="group/image relative"><img src={src} alt={alt} className={className}/>{editable?<button type="button" onClick={stop} className="absolute inset-0 flex items-center justify-center bg-slate-950/0 text-xs font-black text-white opacity-0 transition group-hover/image:bg-slate-950/35 group-hover/image:opacity-100">Replace image</button>:null}</div>;
}

export function SectionRenderer({ section, locale, viewport = "desktop", editable = false, selected = false, onSelect, onInlineChange, onRequestImage }: Props) {
  const s = section.settings || {};
  if (section.visible === false || s.hiddenOn?.includes(viewport)) return editable ? <button type="button" onClick={onSelect} className="w-full border border-dashed border-slate-300 bg-slate-50 p-3 text-xs text-slate-500">Hidden section · {section.type}</button> : null;
  const style: CSSProperties = { background: String(s.background || "var(--builder-surface, #ffffff)"), color: String(s.foreground || "var(--builder-foreground, #001736)"), paddingTop: px(s.paddingY, 64), paddingBottom: px(s.paddingY, 64), minHeight: section.type === "hero" ? px(s.minHeight, 420) : undefined, borderRadius: s.radius === undefined ? "var(--builder-radius, 0px)" : px(s.radius, 0) };
  const maxWidth = px(s.maxWidth, 1180);
  const align = s.align || "start";
  const alignClass = align === "center" ? "text-center items-center" : align === "end" ? "text-end items-end" : "text-start items-start";
  const wrapper = `relative w-full transition ${editable ? "cursor-pointer hover:outline hover:outline-2 hover:outline-sky-400/70" : ""} ${selected ? "outline outline-2 outline-sky-500 outline-offset-[-2px]" : ""}`;
  const inner = `mx-auto flex w-full flex-col ${alignClass}`;
  const common = { className: wrapper, style, onClick: editable ? (e: MouseEvent) => { e.stopPropagation(); onSelect?.(); } : undefined };
  const inline = (path: string) => (value: string) => onInlineChange?.(path, value);

  if (section.type === "spacer") return <section {...common}><div style={{ height: px(s.paddingY, 32) }}/></section>;

  if (section.type === "hero") {
    const eyebrow = localize(section.content.eyebrow, locale), title = localize(section.content.title, locale), body = localize(section.content.body, locale), button = localize(section.content.buttonLabel, locale);
    return <section {...common}><div className={inner} style={{ maxWidth, paddingInline: "24px", justifyContent: "center" }}>
      {(eyebrow || editable) ? <p className="text-xs font-black uppercase tracking-[.2em] opacity-65"><EditableText value={eyebrow} editable={editable} onChange={inline("eyebrow")}>{eyebrow}</EditableText></p> : null}
      <h2 className="mt-4 max-w-4xl text-4xl font-black leading-tight sm:text-5xl lg:text-6xl"><EditableText value={title} editable={editable} onChange={inline("title")}>{title}</EditableText></h2>
      {(body || editable) ? <p className="mt-5 max-w-2xl text-base leading-8 opacity-75 sm:text-lg"><EditableText value={body} editable={editable} onChange={inline("body")}>{body}</EditableText></p> : null}
      {(button || editable) ? editable ? <span className="mt-7 inline-flex min-h-12 items-center px-6 text-sm font-black text-white" style={darkButton}><EditableText value={button} editable onChange={inline("buttonLabel")}>{button}</EditableText></span> : <Link href={String(section.content.buttonHref || "/")} className="mt-7 inline-flex min-h-12 items-center px-6 text-sm font-black text-white" style={darkButton}>{button}</Link> : null}
    </div></section>;
  }

  if (section.type === "richText") {
    const text = localize(section.content.text as never, locale);
    const isHtml = text.includes("<");
    return <section {...common}><div className="mx-auto w-full" style={{ maxWidth, paddingInline: "24px" }}>{editable ? <EditableText value={text} editable html={isHtml} className={isHtml ? "prose prose-slate max-w-none" : "whitespace-pre-wrap text-base leading-8"} onChange={inline("text")}/> : isHtml ? <div className="prose prose-slate max-w-none" dangerouslySetInnerHTML={{ __html: text }}/> : <div className="whitespace-pre-wrap text-base leading-8">{text}</div>}</div></section>;
  }

  if (section.type === "imageText") {
    const imageFirst = s.imagePosition === "start";
    const title = localize(section.content.title, locale), body = localize(section.content.body, locale);
    return <section {...common}><div className="mx-auto grid w-full items-center gap-10 md:grid-cols-2" style={{ maxWidth, paddingInline: "24px" }}>
      <div className={`flex flex-col ${alignClass} ${imageFirst ? "md:order-2" : ""}`}><h2 className="text-3xl font-black sm:text-4xl"><EditableText value={title} editable={editable} onChange={inline("title")}>{title}</EditableText></h2><p className="mt-4 text-base leading-8 opacity-75"><EditableText value={body} editable={editable} onChange={inline("body")}>{body}</EditableText></p></div>
      <div className={imageFirst ? "md:order-1" : ""}><ReplaceableImage src={String(section.content.imageUrl || "")} alt={localize(section.content.imageAlt, locale)} editable={editable} onReplace={()=>onRequestImage?.({ kind: "section" })} className="aspect-[4/3] w-full rounded-[var(--builder-radius,2rem)] object-cover"/></div>
    </div></section>;
  }

  if (section.type === "cards") {
    const cards = Array.isArray(section.content.cards) ? section.content.cards : [];
    const cols = s.columns === 2 ? "md:grid-cols-2" : s.columns === 4 ? "md:grid-cols-2 xl:grid-cols-4" : "md:grid-cols-3";
    const title = localize(section.content.title, locale);
    return <section {...common}><div className="mx-auto w-full" style={{ maxWidth, paddingInline: "24px" }}>{(title || editable) ? <h2 className="mb-8 text-3xl font-black"><EditableText value={title} editable={editable} onChange={inline("title")}>{title}</EditableText></h2> : null}<div className={`grid gap-5 ${cols}`}>{cards.map(card=><div key={card.id} className="overflow-hidden border border-black/10 shadow-sm" style={surfaceCard}>{card.imageUrl || editable ? <ReplaceableImage src={card.imageUrl} alt="" editable={editable} onReplace={()=>onRequestImage?.({ kind: "card", cardId: card.id })} className="aspect-[16/10] w-full object-cover"/> : null}<div className="p-5"><h3 className="text-lg font-black"><EditableText value={localize(card.title, locale)} editable={editable} onChange={inline(`card:${card.id}:title`)}>{localize(card.title, locale)}</EditableText></h3><p className="mt-2 text-sm leading-7" style={{color:"var(--builder-muted, currentColor)"}}><EditableText value={localize(card.body, locale)} editable={editable} onChange={inline(`card:${card.id}:body`)}>{localize(card.body, locale)}</EditableText></p>{card.href && !editable ? <Link href={card.href} className="mt-4 inline-flex text-xs font-black underline" style={{color:"var(--builder-accent, currentColor)"}}>Open</Link> : null}</div></div>)}</div></div></section>;
  }

  const title = localize(section.content.title, locale), body = localize(section.content.body, locale), button = localize(section.content.buttonLabel, locale);
  return <section {...common}><div className={inner} style={{ maxWidth, paddingInline: "24px" }}><h2 className="text-3xl font-black sm:text-4xl"><EditableText value={title} editable={editable} onChange={inline("title")}>{title}</EditableText></h2><p className="mt-4 max-w-2xl text-base leading-8 opacity-75"><EditableText value={body} editable={editable} onChange={inline("body")}>{body}</EditableText></p>{button || editable ? editable ? <span className="mt-6 inline-flex min-h-12 items-center px-6 text-sm font-black text-white" style={accentButton}><EditableText value={button} editable onChange={inline("buttonLabel")}>{button}</EditableText></span> : <Link href={String(section.content.buttonHref || "/")} className="mt-6 inline-flex min-h-12 items-center px-6 text-sm font-black text-white" style={accentButton}>{button}</Link> : null}</div></section>;
}
