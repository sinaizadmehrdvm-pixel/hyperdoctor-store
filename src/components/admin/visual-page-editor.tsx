"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { ArrowLeft, Check, ChevronDown, ChevronUp, Copy, Eye, EyeOff, GripVertical, History, ImageIcon, Languages, LayoutGrid, Monitor, Palette, Plus, Redo2, Save, Smartphone, Tablet, Trash2, Undo2, UploadCloud, X } from "lucide-react";
import { publishBuilderDraft, restoreBuilderRevision, saveBuilderDraft } from "@/app/admin/(protected)/editor/actions";
import { MediaStudioModal, type EditorMediaAsset } from "@/components/admin/media-studio-modal";
import { SectionRenderer } from "@/components/page-builder/section-renderer";
import {
  createBuilderTemplate,
  createSection,
  defaultBuilderTheme,
  normalizeDocument,
  type BuilderBundle,
  type BuilderCard,
  type BuilderDocument,
  type BuilderLocale,
  type BuilderSection,
  type BuilderSectionType,
  type BuilderTemplate,
  type BuilderViewport,
  type LocalizedText,
} from "@/lib/page-builder";
import type { AdminLocale } from "@/lib/admin-i18n";

const localeList: BuilderLocale[] = ["fa", "tr", "en", "ar"];
const sectionTypes: BuilderSectionType[] = ["hero", "richText", "imageText", "cards", "cta", "spacer"];
const sectionNames: Record<BuilderSectionType, string> = { hero: "Hero", richText: "Rich text", imageText: "Image + text", cards: "Cards", cta: "CTA", spacer: "Spacer" };
const templates: BuilderTemplate[] = ["blank", "landing", "service", "about", "campaign"];

const labels = {
  fa: {back:"صفحات",editor:"ویرایشگر بصری",add:"افزودن بخش",layers:"لایه‌ها",save:"ذخیره",saving:"در حال ذخیره",saved:"ذخیره شد",publish:"انتشار",published:"منتشر شد",undo:"برگشت",redo:"جلو",content:"محتوا",settings:"استایل",history:"نسخه‌ها",theme:"قالب کلی",templates:"الگوها",restore:"بازیابی",select:"یک بخش را انتخاب کنید",title:"عنوان",body:"متن",text:"متن",eyebrow:"بالانویس",button:"متن دکمه",link:"لینک",image:"تصویر",alt:"متن جایگزین",background:"پس‌زمینه",foreground:"رنگ متن",padding:"فاصله عمودی",width:"حداکثر عرض",height:"حداقل ارتفاع",radius:"گردی گوشه",align:"چیدمان",columns:"ستون‌ها",position:"جای تصویر",empty:"هنوز بخشی وجود ندارد",addCard:"افزودن کارت",deleteCard:"حذف کارت",hideOn:"عدم نمایش در",desktop:"دسکتاپ",tablet:"تبلت",mobile:"موبایل",pageBg:"پس‌زمینه صفحه",surface:"سطح",accent:"رنگ اصلی",muted:"رنگ فرعی",gap:"فاصله بین بخش‌ها",fontScale:"اندازه نوشته",small:"کوچک",medium:"متوسط",large:"بزرگ",start:"ابتدا",center:"وسط",end:"انتها",templateBlank:"خالی",templateLanding:"لندینگ",templateService:"خدمات",templateAbout:"درباره ما",templateCampaign:"کمپین",templateConfirm:"این الگو جایگزین بخش‌های فعلی می‌شود. ادامه می‌دهید؟",autosave:"ذخیره خودکار",media:"رسانه",inlineHint:"برای ویرایش متن مستقیم روی آن کلیک کنید",error:"خطا در ذخیره‌سازی",revision:"نسخه",publicPreview:"نمایش سایت",close:"بستن"},
  tr: {back:"Sayfalar",editor:"Görsel düzenleyici",add:"Bölüm ekle",layers:"Katmanlar",save:"Kaydet",saving:"Kaydediliyor",saved:"Kaydedildi",publish:"Yayınla",published:"Yayınlandı",undo:"Geri al",redo:"Yinele",content:"İçerik",settings:"Stil",history:"Sürümler",theme:"Genel tema",templates:"Şablonlar",restore:"Geri yükle",select:"Bir bölüm seçin",title:"Başlık",body:"Metin",text:"Metin",eyebrow:"Üst başlık",button:"Buton metni",link:"Bağlantı",image:"Görsel",alt:"Alternatif metin",background:"Arka plan",foreground:"Metin rengi",padding:"Dikey boşluk",width:"Maks genişlik",height:"Min yükseklik",radius:"Köşe yuvarlama",align:"Hizalama",columns:"Sütunlar",position:"Görsel konumu",empty:"Henüz bölüm yok",addCard:"Kart ekle",deleteCard:"Kartı sil",hideOn:"Şurada gizle",desktop:"Masaüstü",tablet:"Tablet",mobile:"Mobil",pageBg:"Sayfa arka planı",surface:"Yüzey",accent:"Vurgu",muted:"İkincil renk",gap:"Bölüm aralığı",fontScale:"Yazı boyutu",small:"Küçük",medium:"Orta",large:"Büyük",start:"Başlangıç",center:"Orta",end:"Son",templateBlank:"Boş",templateLanding:"Landing",templateService:"Hizmet",templateAbout:"Hakkımızda",templateCampaign:"Kampanya",templateConfirm:"Bu şablon mevcut bölümlerin yerini alacak. Devam edilsin mi?",autosave:"Otomatik kayıt",media:"Medya",inlineHint:"Metni düzenlemek için tuvalde doğrudan tıklayın",error:"Kayıt hatası",revision:"Sürüm",publicPreview:"Canlı site",close:"Kapat"},
  en: {back:"Pages",editor:"Visual editor",add:"Add section",layers:"Layers",save:"Save",saving:"Saving",saved:"Saved",publish:"Publish",published:"Published",undo:"Undo",redo:"Redo",content:"Content",settings:"Style",history:"Versions",theme:"Global theme",templates:"Templates",restore:"Restore",select:"Select a section",title:"Title",body:"Body",text:"Text",eyebrow:"Eyebrow",button:"Button label",link:"Link",image:"Image",alt:"Image alt",background:"Background",foreground:"Text color",padding:"Vertical padding",width:"Max width",height:"Min height",radius:"Corner radius",align:"Alignment",columns:"Columns",position:"Image position",empty:"No sections yet",addCard:"Add card",deleteCard:"Delete card",hideOn:"Hide on",desktop:"Desktop",tablet:"Tablet",mobile:"Mobile",pageBg:"Page background",surface:"Surface",accent:"Accent",muted:"Muted",gap:"Section gap",fontScale:"Font scale",small:"Small",medium:"Medium",large:"Large",start:"Start",center:"Center",end:"End",templateBlank:"Blank",templateLanding:"Landing",templateService:"Service",templateAbout:"About",templateCampaign:"Campaign",templateConfirm:"This template will replace the current sections. Continue?",autosave:"Auto-save",media:"Media",inlineHint:"Click text directly on the canvas to edit it",error:"Save failed",revision:"Revision",publicPreview:"Live site",close:"Close"},
  ar: {back:"الصفحات",editor:"المحرر المرئي",add:"إضافة قسم",layers:"الطبقات",save:"حفظ",saving:"جارٍ الحفظ",saved:"تم الحفظ",publish:"نشر",published:"تم النشر",undo:"تراجع",redo:"إعادة",content:"المحتوى",settings:"النمط",history:"الإصدارات",theme:"السمة العامة",templates:"القوالب",restore:"استعادة",select:"اختر قسماً",title:"العنوان",body:"النص",text:"النص",eyebrow:"العنوان العلوي",button:"نص الزر",link:"الرابط",image:"الصورة",alt:"النص البديل",background:"الخلفية",foreground:"لون النص",padding:"المسافة العمودية",width:"العرض الأقصى",height:"الارتفاع الأدنى",radius:"استدارة الزوايا",align:"المحاذاة",columns:"الأعمدة",position:"موضع الصورة",empty:"لا توجد أقسام بعد",addCard:"إضافة بطاقة",deleteCard:"حذف البطاقة",hideOn:"إخفاء على",desktop:"سطح المكتب",tablet:"جهاز لوحي",mobile:"الهاتف",pageBg:"خلفية الصفحة",surface:"السطح",accent:"اللون الرئيسي",muted:"اللون الثانوي",gap:"المسافة بين الأقسام",fontScale:"حجم الخط",small:"صغير",medium:"متوسط",large:"كبير",start:"البداية",center:"الوسط",end:"النهاية",templateBlank:"فارغ",templateLanding:"هبوط",templateService:"خدمة",templateAbout:"من نحن",templateCampaign:"حملة",templateConfirm:"سيستبدل هذا القالب الأقسام الحالية. هل تريد المتابعة؟",autosave:"حفظ تلقائي",media:"الوسائط",inlineHint:"انقر مباشرة على النص داخل اللوحة لتحريره",error:"فشل الحفظ",revision:"إصدار",publicPreview:"الموقع المباشر",close:"إغلاق"},
} as const;

type InspectorTab = "content" | "style" | "theme" | "history";
type ImageTarget = { kind: "section" } | { kind: "card"; cardId: string };

function deepClone<T>(value: T): T { return JSON.parse(JSON.stringify(value)) as T; }
function localized(value: unknown, locale: BuilderLocale) { return (value && typeof value === "object" ? (value as LocalizedText)[locale] : "") || ""; }

function Field({label,children}:{label:string;children:React.ReactNode}) { return <label className="block"><span className="mb-1.5 block text-[11px] font-black text-slate-500">{label}</span>{children}</label>; }
const inputClass = "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none focus:border-sky-400";
const textareaClass = "min-h-24 w-full resize-y rounded-xl border border-slate-200 bg-white p-3 text-xs leading-6 outline-none focus:border-sky-400";

export function VisualPageEditor({initial,adminLocale,initialMedia}:{initial:BuilderBundle;adminLocale:AdminLocale;initialMedia:EditorMediaAsset[]}) {
  const t=labels[adminLocale];
  const rtl=adminLocale==="fa"||adminLocale==="ar";
  const [doc,setDoc]=useState<BuilderDocument>(()=>normalizeDocument(initial.draft));
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
  const [tab,setTab]=useState<InspectorTab>("content");
  const [autosave,setAutosave]=useState(true);
  const [media,setMedia]=useState(initialMedia);
  const [mediaOpen,setMediaOpen]=useState(false);
  const [imageTarget,setImageTarget]=useState<ImageTarget>({kind:"section"});
  const changeSeq=useRef(0);
  const selected=useMemo(()=>doc.sections.find(s=>s.id===selectedId)??null,[doc,selectedId]);
  const theme={...defaultBuilderTheme,...(doc.theme||{})};
  const canvasWidth=viewport==="desktop"?"100%":viewport==="tablet"?"820px":"390px";
  const liveUrl=`/${locale}/${initial.page.slug}`;

  const commit=useCallback((next:BuilderDocument)=>{
    setPast(p=>[...p.slice(-49),deepClone(doc)]);
    setFuture([]);
    setDoc(next);
    changeSeq.current+=1;
    setDirty(true);
    setStatus("idle");
  },[doc]);
  const mutate=useCallback((fn:(next:BuilderDocument)=>void)=>{const next=deepClone(doc);fn(next);commit(next);},[doc,commit]);
  const updateSelected=useCallback((fn:(section:BuilderSection)=>void)=>{if(!selectedId)return;mutate(d=>{const s=d.sections.find(x=>x.id===selectedId);if(s)fn(s);});},[selectedId,mutate]);
  const add=(type:BuilderSectionType)=>{const section=createSection(type);mutate(d=>d.sections.push(section));setSelectedId(section.id);setTab("content");};
  const move=(delta:number)=>{if(!selectedId)return;const i=doc.sections.findIndex(s=>s.id===selectedId);const j=i+delta;if(i<0||j<0||j>=doc.sections.length)return;mutate(d=>{const [item]=d.sections.splice(i,1);d.sections.splice(j,0,item);});};
  const remove=()=>{if(!selectedId)return;const i=doc.sections.findIndex(s=>s.id===selectedId);mutate(d=>{d.sections=d.sections.filter(s=>s.id!==selectedId);});setSelectedId(doc.sections[i+1]?.id??doc.sections[i-1]?.id??null);};
  const duplicate=()=>{if(!selected)return;const copy=deepClone(selected);copy.id=`${copy.type}-${Date.now()}-${Math.random().toString(36).slice(2,6)}`;const i=doc.sections.findIndex(s=>s.id===selected.id);mutate(d=>d.sections.splice(i+1,0,copy));setSelectedId(copy.id);};
  const undo=useCallback(()=>{const prev=past[past.length-1];if(!prev)return;setFuture(f=>[deepClone(doc),...f].slice(0,50));setPast(p=>p.slice(0,-1));setDoc(prev);changeSeq.current+=1;setDirty(true);setStatus("idle");},[past,doc]);
  const redo=useCallback(()=>{const next=future[0];if(!next)return;setPast(p=>[...p,deepClone(doc)].slice(-50));setFuture(f=>f.slice(1));setDoc(next);changeSeq.current+=1;setDirty(true);setStatus("idle");},[future,doc]);
  const drop=(targetId:string)=>{if(!dragId||dragId===targetId)return;const from=doc.sections.findIndex(s=>s.id===dragId);const to=doc.sections.findIndex(s=>s.id===targetId);if(from<0||to<0)return;mutate(d=>{const [item]=d.sections.splice(from,1);d.sections.splice(to,0,item);});setDragId(null);};

  const saveNow=useCallback(async()=>{
    const seq=changeSeq.current;
    try{setStatus("saving");await saveBuilderDraft(initial.page.id,doc);if(changeSeq.current===seq){setDirty(false);setStatus("saved");}return true;}catch(error){console.error("[visual-editor] save failed",error);setStatus("error");return false;}
  },[doc,initial.page.id]);
  const save=()=>startTransition(()=>void saveNow());
  const publish=()=>startTransition(async()=>{try{setStatus("saving");if(dirty){const ok=await saveNow();if(!ok)return;}const result=await publishBuilderDraft(initial.page.id);setRevision(result.publishedRevision);setDirty(false);setStatus("published");}catch(error){console.error("[visual-editor] publish failed",error);setStatus("error");}});
  const restore=(rev:number)=>startTransition(async()=>{try{const restored=normalizeDocument(await restoreBuilderRevision(initial.page.id,rev));setPast(p=>[...p,deepClone(doc)].slice(-50));setFuture([]);setDoc(restored);setSelectedId(restored.sections[0]?.id??null);changeSeq.current+=1;setDirty(true);setStatus("idle");}catch(error){console.error("[visual-editor] restore failed",error);setStatus("error");}});

  useEffect(()=>{
    if(!autosave||!dirty||status==="saving"||pending)return;
    const timer=window.setTimeout(()=>void saveNow(),1400);
    return()=>window.clearTimeout(timer);
  },[autosave,dirty,status,pending,saveNow]);

  useEffect(()=>{
    const onKey=(event:KeyboardEvent)=>{
      const meta=event.ctrlKey||event.metaKey;
      if(meta&&event.key.toLowerCase()==="s"){event.preventDefault();void saveNow();}
      if(meta&&event.key.toLowerCase()==="z"&&!event.shiftKey){event.preventDefault();undo();}
      if(meta&&(event.key.toLowerCase()==="y"||(event.key.toLowerCase()==="z"&&event.shiftKey))){event.preventDefault();redo();}
      if(event.key==="Escape")setSelectedId(null);
    };
    window.addEventListener("keydown",onKey);
    return()=>window.removeEventListener("keydown",onKey);
  },[saveNow,undo,redo]);

  useEffect(()=>{
    const before=(event:BeforeUnloadEvent)=>{if(dirty){event.preventDefault();event.returnValue="";}};
    window.addEventListener("beforeunload",before);
    return()=>window.removeEventListener("beforeunload",before);
  },[dirty]);

  const setLocalized=(field:string,value:string)=>updateSelected(s=>{const current=(s.content[field]??{}) as LocalizedText;s.content[field]={...current,[locale]:value};});
  const inlineChange=(path:string,value:string)=>{
    if(path.startsWith("card:")){
      const [,cardId,field]=path.split(":");
      updateSelected(s=>{const cards=(s.content.cards||[]) as BuilderCard[];const card=cards.find(c=>c.id===cardId);if(card&&(field==="title"||field==="body")){card[field]={...card[field],[locale]:value};}});
      return;
    }
    setLocalized(path,value);
  };
  const selectImage=(asset:EditorMediaAsset)=>updateSelected(s=>{
    if(imageTarget.kind==="card"){
      const card=((s.content.cards||[]) as BuilderCard[]).find(c=>c.id===imageTarget.cardId);if(card)card.imageUrl=asset.url;
    }else{
      s.content.imageUrl=asset.url;
      const alt=(s.content.imageAlt||{}) as LocalizedText;
      const assetAlt=locale==="fa"?asset.altFa:locale==="tr"?asset.altTr:locale==="ar"?asset.altAr:asset.altEn;
      if(assetAlt)s.content.imageAlt={...alt,[locale]:assetAlt};
    }
  });
  const requestImage=(target:ImageTarget)=>{setImageTarget(target);setMediaOpen(true);};
  const applyTemplate=(template:BuilderTemplate)=>{if(doc.sections.length&&!window.confirm(t.templateConfirm))return;const next=createBuilderTemplate(template);commit(next);setSelectedId(next.sections[0]?.id??null);setTab("content");};
  const updateTheme=(key:keyof typeof defaultBuilderTheme,value:string)=>mutate(d=>{d.theme={...defaultBuilderTheme,...(d.theme||{}),[key]:value};});
  const toggleHidden=(device:BuilderViewport)=>updateSelected(s=>{const list=s.settings?.hiddenOn||[];s.settings={...s.settings,hiddenOn:list.includes(device)?list.filter(v=>v!==device):[...list,device]};});
  const addCard=()=>updateSelected(s=>{const cards=(s.content.cards||[]) as BuilderCard[];cards.push({id:`card-${Date.now()}-${Math.random().toString(36).slice(2,5)}`,title:{[locale]:t.title},body:{[locale]:t.body}});s.content.cards=cards;});
  const deleteCard=(id:string)=>updateSelected(s=>{s.content.cards=((s.content.cards||[]) as BuilderCard[]).filter(c=>c.id!==id);});
  const updateCard=(id:string,key:"title"|"body"|"href",value:string)=>updateSelected(s=>{const card=((s.content.cards||[]) as BuilderCard[]).find(c=>c.id===id);if(!card)return;if(key==="href")card.href=value;else card[key]={...card[key],[locale]:value};});

  const statusText=status==="saving"?t.saving:status==="saved"?t.saved:status==="published"?t.published:status==="error"?t.error:dirty?"●":"✓";
  const templateLabel=(template:BuilderTemplate)=>template==="blank"?t.templateBlank:template==="landing"?t.templateLanding:template==="service"?t.templateService:template==="about"?t.templateAbout:t.templateCampaign;

  return <div className="fixed inset-0 z-[80] flex flex-col bg-[#eef1f5] text-[#001736]" dir={rtl?"rtl":"ltr"}>
    <header className="flex min-h-16 items-center gap-2 border-b border-slate-200 bg-white px-3 sm:px-5">
      <Link href="/admin/pages" className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-black"><ArrowLeft className={`h-4 w-4 ${rtl?"rotate-180":""}`}/><span className="hidden sm:inline">{t.back}</span></Link>
      <div className="min-w-0 flex-1"><div className="truncate text-sm font-black">{t.editor} · {initial.page.titleFa||initial.page.titleEn}</div><div className="flex items-center gap-2 text-[11px] text-slate-500"><span>/{initial.page.slug}</span><span>·</span><span className={status==="error"?"text-rose-600":status==="saved"||status==="published"?"text-emerald-600":""}>{statusText}</span>{revision>0?<><span>·</span><span>v{revision}</span></>:null}</div></div>
      <div className="hidden rounded-xl bg-slate-100 p-1 md:flex">{(["desktop","tablet","mobile"] as BuilderViewport[]).map(v=>{const Icon=v==="desktop"?Monitor:v==="tablet"?Tablet:Smartphone;return <button key={v} onClick={()=>setViewport(v)} title={t[v]} className={`flex h-9 w-10 items-center justify-center rounded-lg ${viewport===v?"bg-white shadow-sm":"text-slate-500"}`}><Icon className="h-4 w-4"/></button>})}</div>
      <div className="hidden items-center rounded-xl border border-slate-200 p-1 sm:flex"><Languages className="mx-2 h-4 w-4 text-slate-400"/>{localeList.map(l=><button key={l} onClick={()=>setLocale(l)} className={`h-8 rounded-lg px-2 text-[11px] font-black uppercase ${locale===l?"bg-[#001736] text-white":""}`}>{l}</button>)}</div>
      <a href={liveUrl} target="_blank" rel="noreferrer" className="hidden h-10 items-center rounded-xl border border-slate-200 px-3 text-xs font-black xl:flex">{t.publicPreview}</a>
      <button onClick={undo} disabled={!past.length} title={t.undo} className="hidden h-10 w-10 items-center justify-center rounded-xl border border-slate-200 disabled:opacity-30 lg:flex"><Undo2 className="h-4 w-4"/></button>
      <button onClick={redo} disabled={!future.length} title={t.redo} className="hidden h-10 w-10 items-center justify-center rounded-xl border border-slate-200 disabled:opacity-30 lg:flex"><Redo2 className="h-4 w-4"/></button>
      <button onClick={save} disabled={pending||!dirty} className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-black disabled:opacity-50"><Save className="h-4 w-4"/><span className="hidden sm:inline">{t.save}</span></button>
      <button onClick={publish} disabled={pending} className="flex h-10 items-center gap-2 rounded-xl bg-[#e80346] px-4 text-xs font-black text-white"><UploadCloud className="h-4 w-4"/><span className="hidden sm:inline">{t.publish}</span></button>
    </header>

    <div className="flex min-h-0 flex-1">
      <aside className="hidden w-72 shrink-0 overflow-y-auto border-e border-slate-200 bg-white lg:block">
        <div className="p-4"><div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-500"><LayoutGrid className="h-4 w-4"/>{t.templates}</div><div className="grid grid-cols-2 gap-2">{templates.map(template=><button key={template} onClick={()=>applyTemplate(template)} className="rounded-xl border border-slate-200 px-3 py-2.5 text-start text-[11px] font-black hover:border-sky-400 hover:bg-sky-50">{templateLabel(template)}</button>)}</div></div>
        <div className="border-t border-slate-100 p-4"><div className="mb-3 text-xs font-black uppercase tracking-wider text-slate-500">{t.add}</div><div className="grid grid-cols-2 gap-2">{sectionTypes.map(type=><button key={type} onClick={()=>add(type)} className="rounded-xl border border-slate-200 p-3 text-start text-[11px] font-bold hover:border-sky-400 hover:bg-sky-50"><Plus className="mb-2 h-4 w-4"/>{sectionNames[type]}</button>)}</div></div>
        <div className="border-t border-slate-100 p-4"><div className="mb-3 text-xs font-black uppercase tracking-wider text-slate-500">{t.layers}</div><div className="space-y-2">{doc.sections.map((s,i)=><button key={s.id} draggable onDragStart={()=>setDragId(s.id)} onDragOver={e=>e.preventDefault()} onDrop={()=>drop(s.id)} onClick={()=>{setSelectedId(s.id);setTab("content");}} className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2.5 text-start text-xs ${selectedId===s.id?"border-sky-400 bg-sky-50":"border-slate-200"}`}><GripVertical className="h-4 w-4 text-slate-400"/><span className="flex-1 truncate">{i+1}. {sectionNames[s.type]}</span>{s.visible===false?<EyeOff className="h-3.5 w-3.5"/>:null}</button>)}</div></div>
      </aside>

      <main className="min-w-0 flex-1 overflow-auto p-4 sm:p-6" onClick={()=>setSelectedId(null)} style={{background:theme.pageBackground}}>
        <div className="mx-auto transition-all duration-300" style={{width:canvasWidth,maxWidth:"100%"}}>
          <div className="overflow-hidden rounded-2xl border border-slate-300 shadow-[0_25px_70px_rgba(0,23,54,.12)]" style={{background:theme.pageBackground}}>
            <div style={{display:"grid",gap:`${Math.max(0,Math.min(Number(theme.sectionGap||0),160))}px`}}>
              {doc.sections.length?doc.sections.map((s,i)=><div key={s.id} className="relative" draggable onDragStart={()=>setDragId(s.id)} onDragOver={e=>e.preventDefault()} onDrop={()=>drop(s.id)}>
                {selectedId===s.id?<div className="absolute start-3 top-3 z-30 flex items-center gap-1 rounded-xl bg-[#001736] p-1 text-white shadow-lg"><button onClick={e=>{e.stopPropagation();move(-1)}} disabled={i===0} className="flex h-8 w-8 items-center justify-center disabled:opacity-30"><ChevronUp className="h-4 w-4"/></button><button onClick={e=>{e.stopPropagation();move(1)}} disabled={i===doc.sections.length-1} className="flex h-8 w-8 items-center justify-center disabled:opacity-30"><ChevronDown className="h-4 w-4"/></button><button onClick={e=>{e.stopPropagation();duplicate();}} className="flex h-8 w-8 items-center justify-center"><Copy className="h-4 w-4"/></button><button onClick={e=>{e.stopPropagation();updateSelected(x=>{x.visible=x.visible===false;});}} className="flex h-8 w-8 items-center justify-center">{s.visible===false?<Eye className="h-4 w-4"/>:<EyeOff className="h-4 w-4"/>}</button><button onClick={e=>{e.stopPropagation();remove();}} className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500"><Trash2 className="h-4 w-4"/></button></div>:null}
                <SectionRenderer section={s} locale={locale} viewport={viewport} editable selected={selectedId===s.id} onSelect={()=>setSelectedId(s.id)} onInlineChange={inlineChange} onRequestImage={requestImage}/>
              </div>):<button onClick={e=>{e.stopPropagation();add("hero");}} className="flex min-h-[420px] w-full flex-col items-center justify-center bg-white text-slate-400"><Plus className="mb-3 h-8 w-8"/><span className="text-sm font-black">{t.empty}</span></button>}
            </div>
          </div>
          <p className="mt-3 text-center text-[11px] text-slate-400">{t.inlineHint}</p>
        </div>
      </main>

      <aside className="hidden w-[340px] shrink-0 overflow-y-auto border-s border-slate-200 bg-white xl:block">
        <div className="sticky top-0 z-10 flex border-b border-slate-200 bg-white p-2">{(["content","style","theme","history"] as InspectorTab[]).map(name=>{const icon=name==="content"?<ImageIcon className="h-3.5 w-3.5"/>:name==="style"?<Palette className="h-3.5 w-3.5"/>:name==="theme"?<LayoutGrid className="h-3.5 w-3.5"/>:<History className="h-3.5 w-3.5"/>;return <button key={name} onClick={()=>setTab(name)} className={`flex flex-1 items-center justify-center gap-1 rounded-lg py-2 text-[10px] font-black ${tab===name?"bg-slate-900 text-white":"text-slate-500"}`}>{icon}{name==="content"?t.content:name==="style"?t.settings:name==="theme"?t.theme:t.history}</button>})}</div>

        {tab==="theme"?<div className="space-y-4 p-4"><Field label={t.pageBg}><input type="color" value={theme.pageBackground} onChange={e=>updateTheme("pageBackground",e.target.value)} className="h-10 w-full rounded-xl border border-slate-200 p-1"/></Field><Field label={t.surface}><input type="color" value={theme.surface} onChange={e=>updateTheme("surface",e.target.value)} className="h-10 w-full rounded-xl border border-slate-200 p-1"/></Field><Field label={t.foreground}><input type="color" value={theme.foreground} onChange={e=>updateTheme("foreground",e.target.value)} className="h-10 w-full rounded-xl border border-slate-200 p-1"/></Field><Field label={t.accent}><input type="color" value={theme.accent} onChange={e=>updateTheme("accent",e.target.value)} className="h-10 w-full rounded-xl border border-slate-200 p-1"/></Field><Field label={t.muted}><input type="color" value={theme.muted} onChange={e=>updateTheme("muted",e.target.value)} className="h-10 w-full rounded-xl border border-slate-200 p-1"/></Field><Field label={t.gap}><input type="range" min="0" max="120" value={Number(theme.sectionGap||0)} onChange={e=>updateTheme("sectionGap",e.target.value)} className="w-full"/><div className="text-end text-[10px] text-slate-400">{theme.sectionGap}px</div></Field><Field label={t.radius}><input type="range" min="0" max="48" value={Number(theme.radius||24)} onChange={e=>updateTheme("radius",e.target.value)} className="w-full"/></Field><Field label={t.fontScale}><select value={theme.fontScale} onChange={e=>updateTheme("fontScale",e.target.value)} className={inputClass}><option value="sm">{t.small}</option><option value="md">{t.medium}</option><option value="lg">{t.large}</option></select></Field><label className="flex items-center justify-between rounded-xl bg-slate-50 p-3 text-xs font-black"><span>{t.autosave}</span><input type="checkbox" checked={autosave} onChange={e=>setAutosave(e.target.checked)} /></label></div>:null}

        {tab==="history"?<div className="p-4"><div className="space-y-2">{initial.revisions.length?initial.revisions.map(item=><div key={item.revision} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3"><div className="flex-1"><div className="text-xs font-black">{t.revision} {item.revision}</div>{item.createdAt?<div className="mt-1 text-[10px] text-slate-400">{new Date(item.createdAt).toLocaleString()}</div>:null}</div><button onClick={()=>restore(item.revision)} disabled={pending} className="rounded-lg bg-slate-100 px-3 py-2 text-[10px] font-black">{t.restore}</button></div>):<div className="py-10 text-center text-xs text-slate-400">—</div>}</div></div>:null}

        {(tab==="content"||tab==="style")&&!selected?<div className="p-8 text-center text-xs text-slate-400">{t.select}</div>:null}

        {tab==="content"&&selected?<div className="space-y-4 p-4">
          {selected.type==="hero"?<><Field label={t.eyebrow}><input value={localized(selected.content.eyebrow,locale)} onChange={e=>setLocalized("eyebrow",e.target.value)} className={inputClass}/></Field><Field label={t.title}><textarea value={localized(selected.content.title,locale)} onChange={e=>setLocalized("title",e.target.value)} className={textareaClass}/></Field><Field label={t.body}><textarea value={localized(selected.content.body,locale)} onChange={e=>setLocalized("body",e.target.value)} className={textareaClass}/></Field><Field label={t.button}><input value={localized(selected.content.buttonLabel,locale)} onChange={e=>setLocalized("buttonLabel",e.target.value)} className={inputClass}/></Field><Field label={t.link}><input dir="ltr" value={String(selected.content.buttonHref||"")} onChange={e=>updateSelected(s=>{s.content.buttonHref=e.target.value;})} className={inputClass}/></Field></>:null}
          {selected.type==="richText"?<Field label={t.text}><textarea value={localized(selected.content.text,locale)} onChange={e=>setLocalized("text",e.target.value)} className="min-h-64 w-full rounded-xl border border-slate-200 p-3 text-xs leading-6"/></Field>:null}
          {selected.type==="imageText"?<><Field label={t.title}><textarea value={localized(selected.content.title,locale)} onChange={e=>setLocalized("title",e.target.value)} className={textareaClass}/></Field><Field label={t.body}><textarea value={localized(selected.content.body,locale)} onChange={e=>setLocalized("body",e.target.value)} className={textareaClass}/></Field><button onClick={()=>requestImage({kind:"section"})} className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-sky-200 bg-sky-50 text-xs font-black text-sky-700"><ImageIcon className="h-4 w-4"/>{t.image}</button><Field label={t.alt}><input value={localized(selected.content.imageAlt,locale)} onChange={e=>setLocalized("imageAlt",e.target.value)} className={inputClass}/></Field></>:null}
          {selected.type==="cards"?<><Field label={t.title}><input value={localized(selected.content.title,locale)} onChange={e=>setLocalized("title",e.target.value)} className={inputClass}/></Field><div className="space-y-3">{((selected.content.cards||[]) as BuilderCard[]).map((card,index)=><div key={card.id} className="rounded-2xl border border-slate-200 p-3"><div className="mb-2 flex items-center gap-2"><span className="flex-1 text-[11px] font-black">{index+1}</span><button onClick={()=>requestImage({kind:"card",cardId:card.id})} className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-700"><ImageIcon className="h-3.5 w-3.5"/></button><button onClick={()=>deleteCard(card.id)} className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600"><Trash2 className="h-3.5 w-3.5"/></button></div><input value={card.title[locale]||""} onChange={e=>updateCard(card.id,"title",e.target.value)} placeholder={t.title} className={inputClass}/><textarea value={card.body[locale]||""} onChange={e=>updateCard(card.id,"body",e.target.value)} placeholder={t.body} className={`${textareaClass} mt-2`}/><input dir="ltr" value={card.href||""} onChange={e=>updateCard(card.id,"href",e.target.value)} placeholder={t.link} className={`${inputClass} mt-2`}/></div>)}</div><button onClick={addCard} className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 text-xs font-black"><Plus className="h-4 w-4"/>{t.addCard}</button></>:null}
          {selected.type==="cta"?<><Field label={t.title}><textarea value={localized(selected.content.title,locale)} onChange={e=>setLocalized("title",e.target.value)} className={textareaClass}/></Field><Field label={t.body}><textarea value={localized(selected.content.body,locale)} onChange={e=>setLocalized("body",e.target.value)} className={textareaClass}/></Field><Field label={t.button}><input value={localized(selected.content.buttonLabel,locale)} onChange={e=>setLocalized("buttonLabel",e.target.value)} className={inputClass}/></Field><Field label={t.link}><input dir="ltr" value={String(selected.content.buttonHref||"")} onChange={e=>updateSelected(s=>{s.content.buttonHref=e.target.value;})} className={inputClass}/></Field></>:null}
        </div>:null}

        {tab==="style"&&selected?<div className="space-y-4 p-4"><Field label={t.background}><input type="color" value={String(selected.settings?.background||"#ffffff")} onChange={e=>updateSelected(s=>{s.settings={...s.settings,background:e.target.value};})} className="h-10 w-full rounded-xl border border-slate-200 p-1"/></Field><Field label={t.foreground}><input type="color" value={String(selected.settings?.foreground||"#001736")} onChange={e=>updateSelected(s=>{s.settings={...s.settings,foreground:e.target.value};})} className="h-10 w-full rounded-xl border border-slate-200 p-1"/></Field><Field label={t.padding}><input type="range" min="0" max="180" value={Number(selected.settings?.paddingY||64)} onChange={e=>updateSelected(s=>{s.settings={...s.settings,paddingY:e.target.value};})} className="w-full"/><div className="text-end text-[10px] text-slate-400">{selected.settings?.paddingY||64}px</div></Field><Field label={t.width}><input type="range" min="320" max="1600" step="10" value={Number(selected.settings?.maxWidth||1180)} onChange={e=>updateSelected(s=>{s.settings={...s.settings,maxWidth:e.target.value};})} className="w-full"/><div className="text-end text-[10px] text-slate-400">{selected.settings?.maxWidth||1180}px</div></Field>{selected.type==="hero"?<Field label={t.height}><input type="range" min="240" max="900" step="10" value={Number(selected.settings?.minHeight||520)} onChange={e=>updateSelected(s=>{s.settings={...s.settings,minHeight:e.target.value};})} className="w-full"/></Field>:null}<Field label={t.radius}><input type="range" min="0" max="80" value={Number(selected.settings?.radius||0)} onChange={e=>updateSelected(s=>{s.settings={...s.settings,radius:e.target.value};})} className="w-full"/></Field><Field label={t.align}><select value={selected.settings?.align||"start"} onChange={e=>updateSelected(s=>{s.settings={...s.settings,align:e.target.value as "start"|"center"|"end"};})} className={inputClass}><option value="start">{t.start}</option><option value="center">{t.center}</option><option value="end">{t.end}</option></select></Field>{selected.type==="imageText"?<Field label={t.position}><select value={selected.settings?.imagePosition||"end"} onChange={e=>updateSelected(s=>{s.settings={...s.settings,imagePosition:e.target.value as "start"|"end"};})} className={inputClass}><option value="start">{t.start}</option><option value="end">{t.end}</option></select></Field>:null}{selected.type==="cards"?<Field label={t.columns}><select value={selected.settings?.columns||3} onChange={e=>updateSelected(s=>{s.settings={...s.settings,columns:Number(e.target.value) as 2|3|4};})} className={inputClass}><option value="2">2</option><option value="3">3</option><option value="4">4</option></select></Field>:null}<Field label={t.hideOn}><div className="grid grid-cols-3 gap-2">{(["desktop","tablet","mobile"] as BuilderViewport[]).map(device=>{const hidden=selected.settings?.hiddenOn?.includes(device);return <button key={device} onClick={()=>toggleHidden(device)} className={`rounded-xl border px-2 py-2 text-[10px] font-black ${hidden?"border-rose-300 bg-rose-50 text-rose-600":"border-slate-200"}`}>{hidden?<X className="mx-auto mb-1 h-3.5 w-3.5"/>:<Check className="mx-auto mb-1 h-3.5 w-3.5"/>}{t[device]}</button>})}</div></Field></div>:null}
      </aside>
    </div>

    <MediaStudioModal open={mediaOpen} assets={media} locale={locale} onClose={()=>setMediaOpen(false)} onSelect={selectImage} onUploaded={asset=>setMedia(current=>[asset,...current])}/>
  </div>;
}
