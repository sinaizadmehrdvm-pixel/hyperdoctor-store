import Link from "next/link";
import { ArrowLeft, Blocks, Plus, Save, Trash2 } from "lucide-react";
import { adminRpc } from "@/lib/admin-data";
import { currentAdminLocale } from "@/lib/admin-locale-server";
import type { AdminLocale } from "@/lib/admin-i18n";
import type { BuilderBundle, BuilderSection } from "@/lib/page-builder";
import { deleteSectionPreset, insertSectionPreset, saveDraftSectionAsPreset } from "./actions";

type SectionPreset={id:string;name:string;description:string;section:BuilderSection;createdAt:string;updatedAt:string};
const typeName:Record<string,string>={hero:"Hero",richText:"Rich text",imageText:"Image + text",cards:"Cards",cta:"CTA",spacer:"Spacer"};
const text:Record<AdminLocale,Record<string,string>>={
 fa:{back:"ویرایشگر بصری",title:"کتابخانه بلوک‌ها",desc:"هر بخش واقعی صفحه را ذخیره کنید و بدون انتشار خودکار در صفحات دیگر استفاده کنید.",current:"بخش‌های پیش‌نویس فعلی",saved:"بلوک‌های ذخیره‌شده",name:"نام بلوک",description:"توضیح کوتاه",save:"ذخیره در کتابخانه",insert:"افزودن به انتهای پیش‌نویس",delete:"حذف",empty:"هنوز بلوکی ذخیره نشده است.",sections:"بخش"},
 tr:{back:"Görsel düzenleyici",title:"Blok kitaplığı",desc:"Gerçek bir sayfa bölümünü kaydedin ve otomatik yayınlamadan başka taslaklarda tekrar kullanın.",current:"Mevcut taslak bölümleri",saved:"Kayıtlı bloklar",name:"Blok adı",description:"Kısa açıklama",save:"Kitaplığa kaydet",insert:"Taslağın sonuna ekle",delete:"Sil",empty:"Henüz kayıtlı blok yok.",sections:"bölüm"},
 en:{back:"Visual editor",title:"Block library",desc:"Save a real page section and reuse it in another draft without publishing automatically.",current:"Current draft sections",saved:"Saved blocks",name:"Block name",description:"Short description",save:"Save to library",insert:"Insert at end of draft",delete:"Delete",empty:"No reusable blocks yet.",sections:"section"},
 ar:{back:"المحرر المرئي",title:"مكتبة الكتل",desc:"احفظ قسماً حقيقياً من الصفحة وأعد استخدامه في مسودة أخرى دون نشر تلقائي.",current:"أقسام المسودة الحالية",saved:"الكتل المحفوظة",name:"اسم الكتلة",description:"وصف قصير",save:"حفظ في المكتبة",insert:"إضافة إلى نهاية المسودة",delete:"حذف",empty:"لا توجد كتل محفوظة بعد.",sections:"قسم"},
};

export default async function SectionLibraryPage({params}:{params:Promise<{id:string}>}){
 const {id}=await params;
 const [bundle,presets,locale]=await Promise.all([
  adminRpc<BuilderBundle|null>("admin_page_builder_get",{p_page_id:id}),
  adminRpc<SectionPreset[]>("admin_builder_sections",{p_search:""}),
  currentAdminLocale(),
 ]);
 if(!bundle)return null;
 const t=text[locale];
 return <div className="mx-auto max-w-7xl space-y-7 pb-24">
  <div><Link href={`/admin/editor/${id}`} className="mb-3 inline-flex items-center gap-2 text-xs font-black text-muted"><ArrowLeft className="h-4 w-4"/>{t.back}</Link><div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-700"><Blocks className="h-5 w-5"/></div><div><h1 className="text-2xl font-black text-foreground">{t.title}</h1><p className="mt-1 max-w-3xl text-sm text-muted">{t.desc}</p></div></div></div>

  <section className="space-y-3"><h2 className="text-sm font-black text-foreground">{t.current}</h2><div className="grid gap-4 lg:grid-cols-2">{bundle.draft.sections.map((section,index)=><article key={section.id} className="rounded-2xl border border-border bg-card p-5"><div className="mb-4 flex items-center justify-between gap-3"><div><div className="text-xs font-black uppercase tracking-wide text-violet-700">{index+1}. {typeName[section.type]||section.type}</div><div className="mt-1 text-[11px] text-muted" dir="ltr">{section.id}</div></div></div><form action={saveDraftSectionAsPreset.bind(null,id,section.id)} className="grid gap-3 md:grid-cols-[1fr_1.4fr_auto]"><input name="name" required minLength={2} maxLength={120} placeholder={t.name} className="h-10 rounded-xl border border-border bg-background px-3 text-xs"/><input name="description" maxLength={500} placeholder={t.description} className="h-10 rounded-xl border border-border bg-background px-3 text-xs"/><button className="flex h-10 items-center justify-center gap-2 rounded-xl bg-foreground px-4 text-xs font-black text-background"><Save className="h-4 w-4"/>{t.save}</button></form></article>)}</div></section>

  <section className="space-y-3"><h2 className="text-sm font-black text-foreground">{t.saved}</h2><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{presets.map(preset=><article key={preset.id} className="rounded-2xl border border-border bg-card p-5"><div className="mb-4 flex gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700"><Blocks className="h-5 w-5"/></div><div className="min-w-0 flex-1"><h3 className="truncate font-black text-foreground">{preset.name}</h3><p className="mt-1 line-clamp-2 text-xs leading-5 text-muted">{preset.description||typeName[preset.section.type]||preset.section.type}</p></div></div><div className="flex gap-2"><form action={insertSectionPreset.bind(null,id,preset.id)} className="flex-1"><button className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-primary px-3 text-xs font-black text-white"><Plus className="h-4 w-4"/>{t.insert}</button></form><form action={deleteSectionPreset.bind(null,id,preset.id)}><button title={t.delete} className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-700"><Trash2 className="h-4 w-4"/></button></form></div></article>)}{presets.length===0?<div className="col-span-full rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted">{t.empty}</div>:null}</div></section>
 </div>;
}
