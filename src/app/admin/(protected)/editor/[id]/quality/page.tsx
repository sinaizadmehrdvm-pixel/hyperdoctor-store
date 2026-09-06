import Link from "next/link";
import { AlertTriangle, ArrowLeft, CheckCircle2, CircleAlert, ShieldCheck, UploadCloud } from "lucide-react";
import { adminRpc } from "@/lib/admin-data";
import { currentAdminLocale } from "@/lib/admin-locale-server";
import type { AdminLocale } from "@/lib/admin-i18n";
import type { BuilderBundle } from "@/lib/page-builder";
import { publishQualityChecked } from "./actions";

type Issue={code:string;message:string;sectionId?:string;sectionIndex?:number;locales?:string[]};
type Quality={blocking:boolean;errors:Issue[];warnings:Issue[];errorCount:number;warningCount:number;sectionCount:number};
const text:Record<AdminLocale,Record<string,string>>={
 fa:{back:"ویرایشگر بصری",title:"کنترل کیفیت پیش از انتشار",desc:"این بررسی قطعی قبل از انتشار اجرا می‌شود؛ خطاهای امنیتی و ساختاری انتشار را مسدود می‌کنند و هشدارها برای تکمیل دسترس‌پذیری و ترجمه هستند.",errors:"خطاهای مسدودکننده",warnings:"هشدارها",clean:"هیچ خطای مسدودکننده‌ای پیدا نشد.",publish:"انتشار نسخه بررسی‌شده",blocked:"ابتدا خطاهای زیر را در ویرایشگر اصلاح کنید.",published:"نسخه با موفقیت پس از کنترل کیفیت منتشر شد.",sections:"تعداد بخش‌ها"},
 tr:{back:"Görsel düzenleyici",title:"Yayın öncesi kalite kontrolü",desc:"Bu deterministik kontrol yayınlamadan önce çalışır. Güvenlik/yapı hataları yayını engeller; uyarılar erişilebilirlik ve çeviri kalitesini gösterir.",errors:"Engelleyici hatalar",warnings:"Uyarılar",clean:"Engelleyici hata bulunmadı.",publish:"Kontrol edilmiş sürümü yayınla",blocked:"Önce aşağıdaki hataları düzenleyicide düzeltin.",published:"Sürüm kalite kontrolünden sonra başarıyla yayınlandı.",sections:"Bölüm sayısı"},
 en:{back:"Visual editor",title:"Pre-publish quality gate",desc:"This deterministic check runs before every publish. Security/structure errors block publishing; warnings highlight accessibility and translation gaps.",errors:"Blocking errors",warnings:"Warnings",clean:"No blocking errors found.",publish:"Publish checked version",blocked:"Fix the errors below in the visual editor first.",published:"The version was published successfully after the quality gate.",sections:"Sections"},
 ar:{back:"المحرر المرئي",title:"فحص الجودة قبل النشر",desc:"يعمل هذا الفحص الحتمي قبل كل نشر. أخطاء الأمان والبنية تمنع النشر، بينما تشير التحذيرات إلى مشكلات الوصول والترجمة.",errors:"أخطاء مانعة",warnings:"تحذيرات",clean:"لم يتم العثور على أخطاء مانعة.",publish:"نشر النسخة المفحوصة",blocked:"أصلح الأخطاء التالية في المحرر أولاً.",published:"تم نشر النسخة بنجاح بعد فحص الجودة.",sections:"عدد الأقسام"},
};

export default async function QualityPage({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<{published?:string}>}){
 const {id}=await params; const {published}=await searchParams;
 const [bundle,locale]=await Promise.all([adminRpc<BuilderBundle|null>("admin_page_builder_get",{p_page_id:id}),currentAdminLocale()]);
 if(!bundle)return null;
 const quality=await adminRpc<Quality>("admin_builder_quality",{p_document:bundle.draft});
 const t=text[locale];
 const IssueList=({items,tone}:{items:Issue[];tone:"error"|"warning"})=><div className="space-y-2">{items.map((issue,i)=><div key={`${issue.code}-${issue.sectionId||issue.sectionIndex||i}`} className={`rounded-xl border p-4 ${tone==="error"?"border-rose-200 bg-rose-50":"border-amber-200 bg-amber-50"}`}><div className="flex items-start gap-3">{tone==="error"?<CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-rose-700"/>:<AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700"/>}<div><div className="text-xs font-black text-foreground">{issue.message}</div><div className="mt-1 flex flex-wrap gap-2 text-[10px] text-muted"><code>{issue.code}</code>{issue.sectionId?<code dir="ltr">{issue.sectionId}</code>:null}{issue.locales?.length?<span>{issue.locales.join(" · ").toUpperCase()}</span>:null}</div></div></div></div>)}</div>;
 return <div className="mx-auto max-w-5xl space-y-6 pb-24">
  <div><Link href={`/admin/editor/${id}`} className="mb-3 inline-flex items-center gap-2 text-xs font-black text-muted"><ArrowLeft className="h-4 w-4"/>{t.back}</Link><div className="flex gap-3"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700"><ShieldCheck className="h-5 w-5"/></div><div><h1 className="text-2xl font-black text-foreground">{t.title}</h1><p className="mt-1 max-w-3xl text-sm leading-6 text-muted">{t.desc}</p></div></div></div>
  {published==="1"?<div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-800"><CheckCircle2 className="h-5 w-5"/>{t.published}</div>:null}
  <div className="grid gap-3 sm:grid-cols-3"><div className="rounded-2xl border border-border bg-card p-5"><div className="text-3xl font-black text-foreground">{quality.sectionCount}</div><div className="mt-1 text-xs text-muted">{t.sections}</div></div><div className="rounded-2xl border border-border bg-card p-5"><div className="text-3xl font-black text-rose-600">{quality.errorCount}</div><div className="mt-1 text-xs text-muted">{t.errors}</div></div><div className="rounded-2xl border border-border bg-card p-5"><div className="text-3xl font-black text-amber-600">{quality.warningCount}</div><div className="mt-1 text-xs text-muted">{t.warnings}</div></div></div>
  {quality.blocking?<div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm font-bold text-rose-800">{t.blocked}</div>:<div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm font-bold text-emerald-800"><CheckCircle2 className="h-5 w-5"/>{t.clean}</div>}
  {quality.errors.length?<section className="space-y-3"><h2 className="text-sm font-black text-foreground">{t.errors}</h2><IssueList items={quality.errors} tone="error"/></section>:null}
  {quality.warnings.length?<section className="space-y-3"><h2 className="text-sm font-black text-foreground">{t.warnings}</h2><IssueList items={quality.warnings} tone="warning"/></section>:null}
  <div className="flex justify-end"><form action={publishQualityChecked.bind(null,id)}><button disabled={quality.blocking} className="flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-40"><UploadCloud className="h-4 w-4"/>{t.publish}</button></form></div>
 </div>;
}
