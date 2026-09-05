import Link from "next/link";
import type { BuilderLocale, BuilderSection, BuilderViewport } from "@/lib/page-builder";
import { localize } from "@/lib/page-builder";

type Props={section:BuilderSection;locale:BuilderLocale;viewport?:BuilderViewport;editable?:boolean;selected?:boolean;onSelect?:()=>void};
const px=(value:unknown,fallback:number)=>{const n=Number(value);return Number.isFinite(n)?`${Math.max(0,Math.min(n,2000))}px`:`${fallback}px`};

export function SectionRenderer({section,locale,viewport="desktop",editable=false,selected=false,onSelect}:Props){
  const s=section.settings||{};
  if(section.visible===false||s.hiddenOn?.includes(viewport)) return editable?<button type="button" onClick={onSelect} className="w-full border border-dashed border-slate-300 bg-slate-50 p-3 text-xs text-slate-500">Hidden section · {section.type}</button>:null;
  const style={background:String(s.background||"#ffffff"),color:String(s.foreground||"#001736"),paddingTop:px(s.paddingY,64),paddingBottom:px(s.paddingY,64),minHeight:section.type==="hero"?px(s.minHeight,420):undefined};
  const maxWidth=px(s.maxWidth,1180);
  const align=s.align||"start";
  const alignClass=align==="center"?"text-center items-center":align==="end"?"text-end items-end":"text-start items-start";
  const wrapper=`relative w-full transition ${editable?"cursor-pointer hover:outline hover:outline-2 hover:outline-sky-400/70":""} ${selected?"outline outline-2 outline-sky-500":""}`;
  const inner=`mx-auto flex w-full flex-col ${alignClass}`;
  const common={className:wrapper,style,onClick:editable?(e:React.MouseEvent)=>{e.stopPropagation();onSelect?.()}:undefined};

  if(section.type==="spacer") return <section {...common}><div style={{height:px(s.paddingY,32)}}/></section>;

  if(section.type==="hero") return <section {...common}><div className={inner} style={{maxWidth,paddingInline:"24px",justifyContent:"center"}}>
    {localize(section.content.eyebrow,locale)?<p className="text-xs font-black uppercase tracking-[.2em] opacity-65">{localize(section.content.eyebrow,locale)}</p>:null}
    <h2 className="mt-4 max-w-4xl text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">{localize(section.content.title,locale)}</h2>
    {localize(section.content.body,locale)?<p className="mt-5 max-w-2xl text-base leading-8 opacity-75 sm:text-lg">{localize(section.content.body,locale)}</p>:null}
    {localize(section.content.buttonLabel,locale)?<Link href={String(section.content.buttonHref||"/")} className="mt-7 inline-flex min-h-12 items-center rounded-xl bg-[#001736] px-6 text-sm font-black text-white">{localize(section.content.buttonLabel,locale)}</Link>:null}
  </div></section>;

  if(section.type==="richText"){const text=localize(section.content.text as never,locale);return <section {...common}><div className="mx-auto w-full" style={{maxWidth,paddingInline:"24px"}}>{text.includes("<")?<div className="prose prose-slate max-w-none" dangerouslySetInnerHTML={{__html:text}}/>:<div className="whitespace-pre-wrap text-base leading-8">{text}</div>}</div></section>}

  if(section.type==="imageText"){
    const imageFirst=s.imagePosition==="start";
    return <section {...common}><div className="mx-auto grid w-full items-center gap-10 md:grid-cols-2" style={{maxWidth,paddingInline:"24px"}}>
      <div className={`flex flex-col ${alignClass} ${imageFirst?"md:order-2":""}`}><h2 className="text-3xl font-black sm:text-4xl">{localize(section.content.title,locale)}</h2><p className="mt-4 text-base leading-8 opacity-75">{localize(section.content.body,locale)}</p></div>
      <div className={imageFirst?"md:order-1":""}>{section.content.imageUrl?<img src={String(section.content.imageUrl)} alt={localize(section.content.imageAlt,locale)} className="aspect-[4/3] w-full rounded-[2rem] object-cover"/>:<div className="flex aspect-[4/3] w-full items-center justify-center rounded-[2rem] border border-dashed border-current/20 bg-black/5 text-sm opacity-55">Image</div>}</div>
    </div></section>;
  }

  if(section.type==="cards"){
    const cards=Array.isArray(section.content.cards)?section.content.cards:[];const cols=s.columns===2?"md:grid-cols-2":s.columns===4?"md:grid-cols-2 xl:grid-cols-4":"md:grid-cols-3";
    return <section {...common}><div className="mx-auto w-full" style={{maxWidth,paddingInline:"24px"}}>{localize(section.content.title,locale)?<h2 className="mb-8 text-3xl font-black">{localize(section.content.title,locale)}</h2>:null}<div className={`grid gap-5 ${cols}`}>{cards.map(card=><div key={card.id} className="overflow-hidden rounded-[1.5rem] border border-black/10 bg-white/80 shadow-sm">{card.imageUrl?<img src={card.imageUrl} alt="" className="aspect-[16/10] w-full object-cover"/>:null}<div className="p-5"><h3 className="text-lg font-black">{localize(card.title,locale)}</h3><p className="mt-2 text-sm leading-7 opacity-70">{localize(card.body,locale)}</p>{card.href?<Link href={card.href} className="mt-4 inline-flex text-xs font-black underline">Open</Link>:null}</div></div>)}</div></div></section>;
  }

  return <section {...common}><div className={inner} style={{maxWidth,paddingInline:"24px"}}><h2 className="text-3xl font-black sm:text-4xl">{localize(section.content.title,locale)}</h2><p className="mt-4 max-w-2xl text-base leading-8 opacity-75">{localize(section.content.body,locale)}</p>{localize(section.content.buttonLabel,locale)?<Link href={String(section.content.buttonHref||"/")} className="mt-6 inline-flex min-h-12 items-center rounded-xl bg-[#e80346] px-6 text-sm font-black text-white">{localize(section.content.buttonLabel,locale)}</Link>:null}</div></section>;
}
