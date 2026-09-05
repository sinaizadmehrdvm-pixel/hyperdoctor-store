"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { ArrowLeft, ChevronDown, ChevronUp, Copy, Eye, EyeOff, GripVertical, History, Languages, Monitor, Plus, Redo2, Save, Smartphone, Tablet, Trash2, Undo2, UploadCloud } from "lucide-react";
import { publishBuilderDraft, restoreBuilderRevision, saveBuilderDraft } from "@/app/admin/(protected)/editor/actions";
import { SectionRenderer } from "@/components/page-builder/section-renderer";
import { createSection, type BuilderBundle, type BuilderDocument, type BuilderLocale, type BuilderSection, type BuilderSectionType, type BuilderViewport, type LocalizedText } from "@/lib/page-builder";
import type { AdminLocale } from "@/lib/admin-i18n";

const localeList:BuilderLocale[]=["fa","tr","en","ar"];
const sectionTypes:BuilderSectionType[]=["hero","richText","imageText","cards","cta","spacer"];
const sectionNames:Record<BuilderSectionType,string>={hero:"Hero",richText:"Rich text",imageText:"Image + text",cards:"Cards",cta:"CTA",spacer:"Spacer"};
const labels={
 fa:{back:"صفحات",editor:"ویرایشگر بصری",add:"افزودن بخش",layers:"بخش‌ها",save:"ذخیره",saved:"ذخیره شد",publish:"انتشار",published:"منتشر شد",undo:"برگشت",redo:"جلو",content:"محتوا",settings:"تنظیمات",history:"نسخه‌ها",restore:"بازیابی",select:"یک بخش را انتخاب کنید",title:"عنوان",body:"متن",text:"متن",eyebrow:"بالانویس",button:"متن دکمه",link:"لینک",image:"آدرس تصویر",alt:"متن جایگزین",background:"پس‌زمینه",foreground:"رنگ متن",padding:"فاصله عمودی",width:"حداکثر عرض",height:"حداقل ارتفاع",align:"چیدمان",columns:"ستون‌ها",empty:"هنوز بخشی وجود ندارد"},
 tr:{back:"Sayfalar",editor:"Görsel düzenleyici",add:"Bölüm ekle",layers:"Bölümler",save:"Kaydet",saved:"Kaydedildi",publish:"Yayınla",published:"Yayınlandı",undo:"Geri al",redo:"Yinele",content:"İçerik",settings:"Ayarlar",history:"Sürümler",restore:"Geri yükle",select:"Bir bölüm seçin",title:"Başlık",body:"Metin",text:"Metin",eyebrow:"Üst başlık",button:"Buton metni",link:"Bağlantı",image:"Görsel URL",alt:"Alternatif metin",background:"Arka plan",foreground:"Metin rengi",padding:"Dikey boşluk",width:"Maks genişlik",height:"Min yükseklik",align:"Hizalama",columns:"Sütunlar",empty:"Henüz bölüm yok"},
 en:{back:"Pages",editor:"Visual editor",add:"Add section",layers:"Sections",save:"Save",saved:"Saved",publish:"Publish",published:"Published",undo:"Undo",redo:"Redo",content:"Content",settings:"Settings",history:"Versions",restore:"Restore",select:"Select a section",title:"Title",body:"Body",text:"Text",eyebrow:"Eyebrow",button:"Button label",link:"Link",image:"Image URL",alt:"Image alt",background:"Background",foreground:"Text color",padding:"Vertical padding",width:"Max width",height:"Min height",align:"Alignment",columns:"Columns",empty:"No sections yet"},
 ar:{back:"الصفحات",editor:"المحرر المرئي",add:"إضافة قسم",layers:"الأقسام",save:"حفظ",saved:"تم الحفظ",publish:"نشر",published:"تم النشر",undo:"تراجع",redo:"إعادة",content:"المحتوى",settings:"الإعدادات",history:"الإصدارات",restore:"استعادة",select:"اختر قسماً",title:"العنوان",body:"النص",text:"النص",eyebrow:"العنوان العلوي",button:"نص الزر",link:"الرابط",image:"رابط الصورة",alt:"النص البديل",background:"الخلفية",foreground:"لون النص",padding:"المسافة العمودية",width:"العرض الأقصى",height:"الارتفاع الأدنى",align:"المحاذاة",columns:"الأعمدة",empty:"لا توجد أقسام بعد"}
} as const;

function deepClone<T>(value:T):T{return JSON.parse(JSON.stringify(value)) as T}

export function VisualPageEditor({initial,adminLocale}:{initial:BuilderBundle;adminLocale:AdminLocale}){
 const t=labels[adminLocale];
 const rtl=adminLocale==="fa"||adminLocale==="ar";
 const [doc,setDoc]=useState<BuilderDocument>(initial.draft);
 const [selectedId,setSelectedId]=useState<string|null>(initial.draft.sections[0]?.id??null);
 const [locale,setLocale]=useState<BuilderLocale>(adminLocale);
 const [viewport,setViewport]=useState<BuilderViewport>("desktop");
 const [past,setPast]=useState<BuilderDocument[]>([]);
 const [future,setFuture]=useState<BuilderDocument[]>([]);
 const [dirty,setDirty]=useState(false);
 const [status,setStatus]=useState<"idle"|"saving"|"saved"|"published"|"error">("idle");
 const [revision,setRevision]=useState(initial.publishedRevision);
 const [dragId,setDragId]=useState<string|null>(null);
 const [pending,startTransition]=useTransition();
 const selected=useMemo(()=>doc.sections.find(s=>s.id===selectedId)??null,[doc,selectedId]);
 const canvasWidth=viewport==="desktop"?"100%":viewport==="tablet"?"820px":"390px";

 const commit=(next:BuilderDocument)=>{setPast(p=>[...p.slice(-49),deepClone(doc)]);setFuture([]);setDoc(next);setDirty(true);setStatus("idle")};
 const mutate=(fn:(next:BuilderDocument)=>void)=>{const next=deepClone(doc);fn(next);commit(next)};
 const updateSelected=(fn:(section:BuilderSection)=>void)=>{if(!selectedId)return;mutate(d=>{const s=d.sections.find(x=>x.id===selectedId);if(s)fn(s)})};
 const add=(type:BuilderSectionType)=>{const section=createSection(type);mutate(d=>d.sections.push(section));setSelectedId(section.id)};
 const move=(delta:number)=>{if(!selectedId)return;const i=doc.sections.findIndex(s=>s.id===selectedId);const j=i+delta;if(i<0||j<0||j>=doc.sections.length)return;mutate(d=>{const [item]=d.sections.splice(i,1);d.sections.splice(j,0,item)})};
 const remove=()=>{if(!selectedId)return;const i=doc.sections.findIndex(s=>s.id===selectedId);mutate(d=>{d.sections=d.sections.filter(s=>s.id!==selectedId)});setSelectedId(doc.sections[i+1]?.id??doc.sections[i-1]?.id??null)};
 const duplicate=()=>{if(!selected)return;const copy=deepClone(selected);copy.id=`${copy.type}-${Date.now()}-${Math.random().toString(36).slice(2,6)}`;const i=doc.sections.findIndex(s=>s.id===selected.id);mutate(d=>d.sections.splice(i+1,0,copy));setSelectedId(copy.id)};
 const undo=()=>{const prev=past[past.length-1];if(!prev)return;setFuture(f=>[deepClone(doc),...f].slice(0,50));setPast(p=>p.slice(0,-1));setDoc(prev);setDirty(true)};
 const redo=()=>{const next=future[0];if(!next)return;setPast(p=>[...p,deepClone(doc)].slice(-50));setFuture(f=>f.slice(1));setDoc(next);setDirty(true)};
 const drop=(targetId:string)=>{if(!dragId||dragId===targetId)return;const from=doc.sections.findIndex(s=>s.id===dragId);const to=doc.sections.findIndex(s=>s.id===targetId);if(from<0||to<0)return;mutate(d=>{const [item]=d.sections.splice(from,1);d.sections.splice(to,0,item)});setDragId(null)};
 const save=()=>startTransition(async()=>{try{setStatus("saving");await saveBuilderDraft(initial.page.id,doc);setDirty(false);setStatus("saved")}catch{setStatus("error")}});
 const publish=()=>startTransition(async()=>{try{setStatus("saving");if(dirty)await saveBuilderDraft(initial.page.id,doc);const result=await publishBuilderDraft(initial.page.id);setRevision(result.publishedRevision);setDirty(false);setStatus("published")}catch{setStatus("error")}});
 const restore=(rev:number)=>startTransition(async()=>{try{const restored=await restoreBuilderRevision(initial.page.id,rev);setPast(p=>[...p,deepClone(doc)].slice(-50));setFuture([]);setDoc(restored);setSelectedId(restored.sections[0]?.id??null);setDirty(true);setStatus("idle")}catch{setStatus("error")}});
 const setLocalized=(field:string,value:string)=>updateSelected(s=>{const current=(s.content[field]??{}) as LocalizedText;s.content[field]={...current,[locale]:value}});

 return <div className="fixed inset-0 z-[80] flex flex-col bg-[#eef1f5] text-[#001736]" dir={rtl?"rtl":"ltr"}>
  <header className="flex min-h-16 items-center gap-2 border-b border-slate-200 bg-white px-3 sm:px-5">
   <Link href="/admin/pages" className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-black"><ArrowLeft className={`h-4 w-4 ${rtl?"rotate-180":""}`}/><span className="hidden sm:inline">{t.back}</span></Link>
   <div className="min-w-0 flex-1"><div className="truncate text-sm font-black">{t.editor} · {initial.page.titleFa||initial.page.titleEn}</div><div className="text-[11px] text-slate-500">/{initial.page.slug}{revision>0?` · v${revision}`:""}</div></div>
   <div className="hidden rounded-xl bg-slate-100 p-1 md:flex">{(["desktop","tablet","mobile"] as BuilderViewport[]).map(v=>{const Icon=v==="desktop"?Monitor:v==="tablet"?Tablet:Smartphone;return <button key={v} onClick={()=>setViewport(v)} className={`flex h-9 w-10 items-center justify-center rounded-lg ${viewport===v?"bg-white shadow-sm":"text-slate-500"}`}><Icon className="h-4 w-4"/></button>})}</div>
   <div className="hidden items-center rounded-xl border border-slate-200 p-1 sm:flex"><Languages className="mx-2 h-4 w-4 text-slate-400"/>{localeList.map(l=><button key={l} onClick={()=>setLocale(l)} className={`h-8 rounded-lg px-2 text-[11px] font-black uppercase ${locale===l?"bg-[#001736] text-white":""}`}>{l}</button>)}</div>
   <button onClick={undo} disabled={!past.length} title={t.undo} className="hidden h-10 w-10 items-center justify-center rounded-xl border border-slate-200 disabled:opacity-30 lg:flex"><Undo2 className="h-4 w-4"/></button>
   <button onClick={redo} disabled={!future.length} title={t.redo} className="hidden h-10 w-10 items-center justify-center rounded-xl border border-slate-200 disabled:opacity-30 lg:flex"><Redo2 className="h-4 w-4"/></button>
   <button onClick={save} disabled={pending||!dirty} className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-black disabled:opacity-50"><Save className="h-4 w-4"/><span className="hidden sm:inline">{status==="saved"?t.saved:t.save}</span></button>
   <button onClick={publish} disabled={pending} className="flex h-10 items-center gap-2 rounded-xl bg-[#e80346] px-4 text-xs font-black text-white"><UploadCloud className="h-4 w-4"/><span className="hidden sm:inline">{status==="published"?t.published:t.publish}</span></button>
  </header>

  <div className="flex min-h-0 flex-1">
   <aside className="hidden w-64 shrink-0 overflow-y-auto border-e border-slate-200 bg-white lg:block">
    <div className="p-4"><div className="mb-3 text-xs font-black uppercase tracking-wider text-slate-500">{t.add}</div><div className="grid grid-cols-2 gap-2">{sectionTypes.map(type=><button key={type} onClick={()=>add(type)} className="rounded-xl border border-slate-200 p-3 text-start text-[11px] font-bold hover:border-sky-400 hover:bg-sky-50"><Plus className="mb-2 h-4 w-4"/>{sectionNames[type]}</button>)}</div></div>
    <div className="border-t border-slate-100 p-4"><div className="mb-3 text-xs font-black uppercase tracking-wider text-slate-500">{t.layers}</div><div className="space-y-2">{doc.sections.map((s,i)=><button key={s.id} draggable onDragStart={()=>setDragId(s.id)} onDragOver={e=>e.preventDefault()} onDrop={()=>drop(s.id)} onClick={()=>setSelectedId(s.id)} className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2.5 text-start text-xs ${selectedId===s.id?"border-sky-400 bg-sky-50":"border-slate-200"}`}><GripVertical className="h-4 w-4 text-slate-400"/><span className="flex-1 truncate">{i+1}. {sectionNames[s.type]}</span>{s.visible===false?<EyeOff className="h-3.5 w-3.5"/>:null}</button>)}</div></div>
   </aside>

   <main className="min-w-0 flex-1 overflow-auto p-4 sm:p-6" onClick={()=>setSelectedId(null)}>
    <div className="mx-auto transition-all duration-300" style={{width:canvasWidth,maxWidth:"100%"}}><div className="overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-[0_25px_70px_rgba(0,23,54,.12)]">
     {doc.sections.length?doc.sections.map((s,i)=><div key={s.id} className="relative" draggable onDragStart={()=>setDragId(s.id)} onDragOver={e=>e.preventDefault()} onDrop={()=>drop(s.id)}>
      {selectedId===s.id?<div className="absolute start-3 top-3 z-20 flex items-center gap-1 rounded-xl bg-[#001736] p-1 text-white shadow-lg"><button onClick={e=>{e.stopPropagation();move(-1)}} disabled={i===0} className="flex h-8 w-8 items-center justify-center disabled:opacity-30"><ChevronUp className="h-4 w-4"/></button><button onClick={e=>{e.stopPropagation();move(1)}} disabled={i===doc.sections.length-1} className="flex h-8 w-8 items-center justify-center disabled:opacity-30"><ChevronDown className="h-4 w-4"/></button><button onClick={e=>{e.stopPropagation();duplicate()}} className="flex h-8 w-8 items-center justify-center"><Copy className="h-4 w-4"/></button><button onClick={e=>{e.stopPropagation();updateSelected(x=>{x.visible=x.visible===false})}} className="flex h-8 w-8 items-center justify-center">{s.visible===false?<Eye className="h-4 w-4"/>:<EyeOff className="h-4 w-4"/>}</button><button onClick={e=>{e.stopPropagation();remove()}} className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500"><Trash2 className="h-4 w-4"/></button></div>:null}
      <SectionRenderer section={s} locale={locale} viewport={viewport} editable selected={selectedId===s.id} onSelect={()=>setSelectedId(s.id)}/>
     </div>):<div className="flex min-h-[520px] flex-col items-center justify-center p-10 text-center text-sm text-slate-500"><Monitor className="mb-4 h-10 w-10"/>{t.empty}<button onClick={e=>{e.stopPropagation();add("hero")}} className="mt-5 rounded-xl bg-[#001736] px-5 py-3 text-xs font-black text-white">{t.add}</button></div>}
    </div></div>
   </main>

   <aside className="w-[320px] shrink-0 overflow-y-auto border-s border-slate-200 bg-white max-xl:hidden">
    {selected?<Inspector section={selected} locale={locale} t={t} setLocalized={setLocalized} update={updateSelected}/>:<div className="p-6 text-center text-sm text-slate-500">{t.select}</div>}
    <div className="border-t border-slate-100 p-5"><div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-500"><History className="h-4 w-4"/>{t.history}</div><div className="space-y-2">{initial.revisions.map(r=><div key={r.revision} className="flex items-center gap-2 rounded-xl border border-slate-200 p-3"><span className="flex-1 text-xs font-bold">v{r.revision}</span><button onClick={()=>restore(r.revision)} disabled={pending} className="rounded-lg bg-slate-100 px-2 py-1.5 text-[10px] font-black">{t.restore}</button></div>)}</div></div>
   </aside>
  </div>
  {status==="error"?<div className="fixed bottom-5 start-1/2 -translate-x-1/2 rounded-xl bg-rose-600 px-4 py-3 text-xs font-black text-white shadow-xl">Save failed</div>:null}
 </div>
}

function Inspector({section,locale,t,setLocalized,update}:{section:BuilderSection;locale:BuilderLocale;t:(typeof labels)[AdminLocale];setLocalized:(field:string,value:string)=>void;update:(fn:(s:BuilderSection)=>void)=>void}){
 const localized=(field:string)=>String(((section.content[field] as LocalizedText|undefined)?.[locale])??"");
 const TextField=({label,field,multi=false}:{label:string;field:string;multi?:boolean})=><label className="block"><span className="mb-1.5 block text-[11px] font-bold text-slate-500">{label} · {locale.toUpperCase()}</span>{multi?<textarea rows={4} value={localized(field)} onChange={e=>setLocalized(field,e.target.value)} className="w-full rounded-xl border border-slate-200 p-3 text-sm"/>:<input value={localized(field)} onChange={e=>setLocalized(field,e.target.value)} className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"/>}</label>;
 const Plain=({label,value,onChange,type="text"}:{label:string;value:string;onChange:(v:string)=>void;type?:string})=><label className="block"><span className="mb-1.5 block text-[11px] font-bold text-slate-500">{label}</span><input type={type} value={value} onChange={e=>onChange(e.target.value)} className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"/></label>;
 return <>
  <div className="border-b border-slate-100 p-5"><div className="mb-4 text-xs font-black uppercase tracking-wider text-slate-500">{t.content}</div><div className="space-y-4">
   {section.type==="hero"?<><TextField label={t.eyebrow} field="eyebrow"/><TextField label={t.title} field="title"/><TextField label={t.body} field="body" multi/><TextField label={t.button} field="buttonLabel"/><Plain label={t.link} value={String(section.content.buttonHref||"")} onChange={v=>update(s=>{s.content.buttonHref=v})}/></>:null}
   {section.type==="richText"?<TextField label={t.text} field="text" multi/>:null}
   {section.type==="imageText"?<><TextField label={t.title} field="title"/><TextField label={t.body} field="body" multi/><Plain label={t.image} value={String(section.content.imageUrl||"")} onChange={v=>update(s=>{s.content.imageUrl=v})}/><TextField label={t.alt} field="imageAlt"/></>:null}
   {section.type==="cta"?<><TextField label={t.title} field="title"/><TextField label={t.body} field="body" multi/><TextField label={t.button} field="buttonLabel"/><Plain label={t.link} value={String(section.content.buttonHref||"")} onChange={v=>update(s=>{s.content.buttonHref=v})}/></>:null}
   {section.type==="cards"?<><TextField label={t.title} field="title"/><Plain label={t.columns} type="number" value={String(section.settings?.columns||3)} onChange={v=>update(s=>{s.settings={...s.settings,columns:([2,3,4].includes(Number(v))?Number(v):3) as 2|3|4}})}/>{(section.content.cards||[]).map((card,i)=><div key={card.id} className="rounded-xl border border-slate-200 p-3"><input value={String(card.title?.[locale]||"")} onChange={e=>update(s=>{const c=(s.content.cards||[])[i];c.title={...c.title,[locale]:e.target.value}})} className="mb-2 h-9 w-full rounded-lg border border-slate-200 px-2 text-xs"/><textarea value={String(card.body?.[locale]||"")} onChange={e=>update(s=>{const c=(s.content.cards||[])[i];c.body={...c.body,[locale]:e.target.value}})} rows={2} className="w-full rounded-lg border border-slate-200 p-2 text-xs"/></div>)}</>:null}
  </div></div>
  <div className="p-5"><div className="mb-4 text-xs font-black uppercase tracking-wider text-slate-500">{t.settings}</div><div className="space-y-4"><div className="grid grid-cols-2 gap-3"><Plain label={t.background} type="color" value={String(section.settings?.background||"#ffffff")} onChange={v=>update(s=>{s.settings={...s.settings,background:v}})}/><Plain label={t.foreground} type="color" value={String(section.settings?.foreground||"#001736")} onChange={v=>update(s=>{s.settings={...s.settings,foreground:v}})}/></div><Plain label={t.padding} type="number" value={String(section.settings?.paddingY||64)} onChange={v=>update(s=>{s.settings={...s.settings,paddingY:v}})}/><Plain label={t.width} type="number" value={String(section.settings?.maxWidth||1180)} onChange={v=>update(s=>{s.settings={...s.settings,maxWidth:v}})}/>{section.type==="hero"?<Plain label={t.height} type="number" value={String(section.settings?.minHeight||520)} onChange={v=>update(s=>{s.settings={...s.settings,minHeight:v}})}/>:null}<label className="block"><span className="mb-1.5 block text-[11px] font-bold text-slate-500">{t.align}</span><select value={String(section.settings?.align||"start")} onChange={e=>update(s=>{s.settings={...s.settings,align:e.target.value as "start"|"center"|"end"}})} className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"><option value="start">Start</option><option value="center">Center</option><option value="end">End</option></select></label></div></div>
 </>
}
