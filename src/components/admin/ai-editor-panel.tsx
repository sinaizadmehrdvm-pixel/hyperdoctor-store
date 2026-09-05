"use client";

import { useMemo, useState } from "react";
import { Check, Languages, Loader2, MonitorSmartphone, RefreshCw, Sparkles, WandSparkles, X } from "lucide-react";
import { PageBuilderDocumentRenderer } from "@/components/page-builder/document-renderer";
import type { AdminLocale } from "@/lib/admin-i18n";
import type { BuilderDiff } from "@/lib/page-builder-ai";
import type { BuilderDocument, BuilderLocale } from "@/lib/page-builder";

type Proposal = {
  summary: string;
  document: BuilderDocument;
  changes: BuilderDiff;
  model: string;
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } | null;
};

type Props = {
  open: boolean;
  document: BuilderDocument;
  locale: BuilderLocale;
  adminLocale: AdminLocale;
  selectedSectionId: string | null;
  onClose: () => void;
  onApply: (document: BuilderDocument) => void;
};

const copy = {
  fa: {title:"دستیار هوشمند طراحی",subtitle:"تغییر پیشنهادی ابتدا پیش‌نمایش می‌شود و بدون تأیید شما روی Draft اعمال نمی‌شود.",prompt:"دقیقاً چه تغییری می‌خواهید؟",placeholder:"مثلاً این Hero را حرفه‌ای‌تر و مینیمال‌تر کن و نسخه موبایلش را هم بهینه کن…",page:"کل صفحه",section:"بخش انتخاب‌شده",run:"پیشنهاد AI",apply:"اعمال روی Draft",reject:"رد پیشنهاد",retry:"دوباره اجرا",preview:"پیش‌نمایش پیشنهاد",summary:"خلاصه تغییر",changes:"تغییرات",added:"افزوده",removed:"حذف",changed:"ویرایش",theme:"قالب",translate:"ترجمه چهارزبانه",mobile:"بهینه‌سازی Responsive",polish:"حرفه‌ای‌تر کردن محتوا",landing:"تقویت ساختار صفحه",select:"برای حالت بخش، ابتدا یک Section انتخاب کنید.",error:"اجرای AI ناموفق بود.",notConfigured:"AI Gateway در محیط Deploy در دسترس نیست.",model:"مدل"},
  tr: {title:"AI tasarım asistanı",subtitle:"Önerilen değişiklik önce önizlenir ve siz onaylamadan taslağa uygulanmaz.",prompt:"Tam olarak ne değiştirmek istiyorsunuz?",placeholder:"Örneğin bu Hero alanını daha premium ve minimal yap, mobil düzeni de iyileştir…",page:"Tüm sayfa",section:"Seçili bölüm",run:"AI önerisi",apply:"Taslağa uygula",reject:"Öneriyi reddet",retry:"Tekrar çalıştır",preview:"Öneri önizlemesi",summary:"Değişiklik özeti",changes:"Değişiklikler",added:"Eklendi",removed:"Silindi",changed:"Düzenlendi",theme:"Tema",translate:"4 dil çeviri",mobile:"Responsive iyileştir",polish:"İçeriği profesyonelleştir",landing:"Sayfa yapısını güçlendir",select:"Bölüm modu için önce bir bölüm seçin.",error:"AI çalıştırılamadı.",notConfigured:"AI Gateway deploy ortamında kullanılabilir değil.",model:"Model"},
  en: {title:"AI design assistant",subtitle:"Every proposal is previewed first and is never applied to the draft without your approval.",prompt:"What exactly should change?",placeholder:"For example: make this Hero more premium and minimal, and improve the mobile layout…",page:"Whole page",section:"Selected section",run:"Generate proposal",apply:"Apply to draft",reject:"Reject proposal",retry:"Run again",preview:"Proposal preview",summary:"Change summary",changes:"Changes",added:"Added",removed:"Removed",changed:"Edited",theme:"Theme",translate:"Translate 4 languages",mobile:"Optimize responsive",polish:"Polish content",landing:"Strengthen page structure",select:"Select a section before using section scope.",error:"AI request failed.",notConfigured:"AI Gateway is not available in the deployment environment.",model:"Model"},
  ar: {title:"مساعد التصميم الذكي",subtitle:"يتم عرض كل اقتراح أولاً ولا يتم تطبيقه على المسودة دون موافقتك.",prompt:"ما التغيير الذي تريده بالضبط؟",placeholder:"مثلاً: اجعل قسم Hero أكثر احترافية وبساطة وحسّن تصميم الهاتف…",page:"الصفحة كاملة",section:"القسم المحدد",run:"إنشاء اقتراح",apply:"تطبيق على المسودة",reject:"رفض الاقتراح",retry:"تشغيل مجدداً",preview:"معاينة الاقتراح",summary:"ملخص التغيير",changes:"التغييرات",added:"مضاف",removed:"محذوف",changed:"معدل",theme:"السمة",translate:"ترجمة 4 لغات",mobile:"تحسين التجاوب",polish:"تحسين المحتوى",landing:"تقوية بنية الصفحة",select:"حدد قسماً أولاً لاستخدام وضع القسم.",error:"فشل طلب الذكاء الاصطناعي.",notConfigured:"بوابة AI غير متاحة في بيئة النشر.",model:"النموذج"},
} as const;

export function AiEditorPanel({open,document,locale,adminLocale,selectedSectionId,onClose,onApply}:Props){
  const t=copy[adminLocale];
  const rtl=adminLocale==="fa"||adminLocale==="ar";
  const [instruction,setInstruction]=useState("");
  const [scope,setScope]=useState<"page"|"section">(selectedSectionId?"section":"page");
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState<string|null>(null);
  const [proposal,setProposal]=useState<Proposal|null>(null);
  const activeScope=scope==="section"&&!selectedSectionId?"page":scope;
  const previewHeight=useMemo(()=>Math.max(500,Math.min(1300,proposal?.document.sections.length?proposal.document.sections.length*330:500)),[proposal]);

  if(!open)return null;

  const run=async(mode:"edit"|"translate"|"responsive"="edit",override?:string)=>{
    const prompt=(override??instruction).trim();
    if(!prompt)return;
    if(scope==="section"&&!selectedSectionId){setError(t.select);return;}
    setLoading(true);setError(null);setProposal(null);
    try{
      const response=await fetch("/api/admin/editor-ai",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({instruction:prompt,document,scope:activeScope,selectedSectionId,locale,mode}),
      });
      const payload=await response.json().catch(()=>({}));
      if(!response.ok){
        setError(payload?.error==="ai_not_configured"?t.notConfigured:`${t.error} (${payload?.error||response.status})`);
        return;
      }
      setProposal(payload as Proposal);
    }catch{
      setError(t.error);
    }finally{
      setLoading(false);
    }
  };

  const quick=(kind:"translate"|"responsive"|"polish"|"landing")=>{
    if(kind==="translate")return void run("translate","Translate the requested scope professionally into all four supported languages: Persian, Turkish, English and Arabic. Preserve all factual meaning, brand names, links, images and design settings.");
    if(kind==="responsive")return void run("responsive","Optimize the requested scope for desktop, tablet and mobile. Improve spacing, widths, section heights, card columns, alignment and responsive visibility while preserving content and factual meaning.");
    if(kind==="polish")return void run("edit","Polish the copy and visual hierarchy so it feels premium, trustworthy, concise and appropriate for a professional medical-equipment brand. Preserve all factual claims, prices, specifications, links and images exactly unless already present.");
    return void run("edit","Strengthen the page structure and conversion flow using the existing content. Improve hierarchy, section order, CTA placement and visual rhythm without inventing business facts, prices, certifications or product claims.");
  };

  return <div className="fixed inset-0 z-[120] flex bg-slate-950/45 backdrop-blur-sm" dir={rtl?"rtl":"ltr"}>
    <div className="ms-auto flex h-full w-full max-w-[760px] flex-col border-s border-slate-200 bg-[#f7f9fc] shadow-2xl">
      <header className="flex items-start gap-3 border-b border-slate-200 bg-white p-4 sm:p-5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-sky-500 text-white shadow-lg"><Sparkles className="h-5 w-5"/></div>
        <div className="min-w-0 flex-1"><h2 className="text-base font-black text-[#001736]">{t.title}</h2><p className="mt-1 text-xs leading-5 text-slate-500">{t.subtitle}</p></div>
        <button onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white"><X className="h-4 w-4"/></button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex gap-2 rounded-2xl bg-slate-100 p-1">
            <button onClick={()=>setScope("page")} className={`flex-1 rounded-xl px-3 py-2 text-xs font-black ${scope==="page"?"bg-white shadow-sm":"text-slate-500"}`}>{t.page}</button>
            <button onClick={()=>setScope("section")} disabled={!selectedSectionId} className={`flex-1 rounded-xl px-3 py-2 text-xs font-black disabled:opacity-35 ${scope==="section"?"bg-white shadow-sm":"text-slate-500"}`}>{t.section}</button>
          </div>
          <label className="block text-xs font-black text-slate-600">{t.prompt}</label>
          <textarea value={instruction} onChange={e=>setInstruction(e.target.value)} placeholder={t.placeholder} className="mt-2 min-h-28 w-full resize-y rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-7 outline-none focus:border-violet-400 focus:bg-white" maxLength={4000}/>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <button onClick={()=>quick("translate")} disabled={loading} className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl border border-slate-200 px-2 text-[10px] font-black hover:border-violet-300 hover:bg-violet-50"><Languages className="h-4 w-4"/>{t.translate}</button>
            <button onClick={()=>quick("responsive")} disabled={loading} className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl border border-slate-200 px-2 text-[10px] font-black hover:border-violet-300 hover:bg-violet-50"><MonitorSmartphone className="h-4 w-4"/>{t.mobile}</button>
            <button onClick={()=>quick("polish")} disabled={loading} className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl border border-slate-200 px-2 text-[10px] font-black hover:border-violet-300 hover:bg-violet-50"><WandSparkles className="h-4 w-4"/>{t.polish}</button>
            <button onClick={()=>quick("landing")} disabled={loading} className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl border border-slate-200 px-2 text-[10px] font-black hover:border-violet-300 hover:bg-violet-50"><RefreshCw className="h-4 w-4"/>{t.landing}</button>
          </div>
          <button onClick={()=>void run()} disabled={loading||instruction.trim().length<2} className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#001736] px-5 text-sm font-black text-white disabled:opacity-40">{loading?<Loader2 className="h-4 w-4 animate-spin"/>:<Sparkles className="h-4 w-4"/>}{t.run}</button>
          {error?<div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-700">{error}</div>:null}
        </div>

        {proposal?<div className="mt-4 space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-[11px] font-black uppercase tracking-wider text-slate-400">{t.summary}</div>
            <p className="mt-2 text-sm font-bold leading-7 text-slate-700">{proposal.summary}</p>
            <div className="mt-4 grid grid-cols-4 gap-2 text-center">
              <div className="rounded-xl bg-emerald-50 p-2"><div className="text-lg font-black text-emerald-700">{proposal.changes.sectionsAdded}</div><div className="text-[9px] font-bold text-emerald-700">{t.added}</div></div>
              <div className="rounded-xl bg-rose-50 p-2"><div className="text-lg font-black text-rose-700">{proposal.changes.sectionsRemoved}</div><div className="text-[9px] font-bold text-rose-700">{t.removed}</div></div>
              <div className="rounded-xl bg-sky-50 p-2"><div className="text-lg font-black text-sky-700">{proposal.changes.sectionsChanged}</div><div className="text-[9px] font-bold text-sky-700">{t.changed}</div></div>
              <div className="rounded-xl bg-violet-50 p-2"><div className="text-lg font-black text-violet-700">{proposal.changes.themeChanged?"✓":"—"}</div><div className="text-[9px] font-bold text-violet-700">{t.theme}</div></div>
            </div>
            <div className="mt-3 text-[10px] text-slate-400">{t.model}: <span dir="ltr">{proposal.model}</span>{proposal.usage?.total_tokens?` · ${proposal.usage.total_tokens} tokens`:""}</div>
          </div>

          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-4 py-3 text-xs font-black text-slate-600">{t.preview}</div>
            <div className="relative overflow-hidden bg-slate-100" style={{height:Math.min(previewHeight,760)}}>
              <div className="absolute left-0 top-0 origin-top-left" style={{transform:"scale(.5)",width:"200%"}}><PageBuilderDocumentRenderer document={proposal.document} locale={locale}/></div>
            </div>
          </div>
        </div>:null}
      </div>

      {proposal?<footer className="grid grid-cols-2 gap-3 border-t border-slate-200 bg-white p-4 sm:p-5">
        <button onClick={()=>setProposal(null)} className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 text-sm font-black"><X className="h-4 w-4"/>{t.reject}</button>
        <button onClick={()=>{onApply(proposal.document);setProposal(null);onClose();}} className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-600 text-sm font-black text-white"><Check className="h-4 w-4"/>{t.apply}</button>
      </footer>:null}
    </div>
  </div>;
}
