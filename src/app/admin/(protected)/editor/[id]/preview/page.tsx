import Link from "next/link";
import { ArrowLeft, ExternalLink, Link2, ShieldCheck, XCircle } from "lucide-react";
import { adminRpc } from "@/lib/admin-data";
import { currentAdminLocale } from "@/lib/admin-locale-server";
import type { AdminLocale } from "@/lib/admin-i18n";
import type { BuilderBundle } from "@/lib/page-builder";
import { createBuilderPreview, revokeBuilderPreview } from "./actions";

type PreviewRow={id:string;expiresAt:string;createdAt:string;revokedAt?:string|null;active:boolean};

const text:Record<AdminLocale,Record<string,string>>={
  fa:{back:"ویرایشگر بصری",title:"پیش‌نمایش امن پیش‌نویس",guard:"محافظت‌شده با توکن · فقط پیش‌نویس",created:"لینک پیش‌نمایش ساخته شد",shownOnce:"این توکن فقط همین بار نمایش داده می‌شود.",expires:"انقضا",automatic:"خودکار",newLink:"ساخت لینک امن پیش‌نمایش",create:"ساخت پیش‌نمایش",hint:"این لینک آخرین پیش‌نویس ذخیره‌شده را نمایش می‌دهد و هیچ چیزی را منتشر نمی‌کند.",history:"تاریخچه پیش‌نمایش",active:"فعال",inactive:"منقضی / لغوشده",createdAt:"ساخته‌شده",revoke:"لغو",empty:"هنوز لینک پیش‌نمایشی ساخته نشده است.",preview:"پیش‌نمایش",m15:"۱۵ دقیقه",h1:"۱ ساعت",h24:"۲۴ ساعت",d7:"۷ روز"},
  tr:{back:"Görsel düzenleyici",title:"Güvenli taslak önizleme",guard:"Token korumalı · yalnızca taslak",created:"Önizleme bağlantısı oluşturuldu",shownOnce:"Bu token yalnızca şimdi gösterilir.",expires:"Bitiş",automatic:"otomatik",newLink:"Yeni güvenli önizleme bağlantısı",create:"Önizleme oluştur",hint:"Bağlantı son kaydedilmiş taslağı gösterir ve hiçbir şeyi yayınlamaz.",history:"Önizleme geçmişi",active:"Aktif",inactive:"Süresi doldu / iptal edildi",createdAt:"Oluşturuldu",revoke:"İptal et",empty:"Henüz önizleme bağlantısı yok.",preview:"önizleme",m15:"15 dakika",h1:"1 saat",h24:"24 saat",d7:"7 gün"},
  en:{back:"Visual editor",title:"Secure draft preview",guard:"Token-gated · draft only",created:"Preview link created",shownOnce:"This token is shown only now.",expires:"Expires",automatic:"automatically",newLink:"Create a new secure preview link",create:"Create preview",hint:"The link reads the latest saved draft and never publishes it.",history:"Preview history",active:"Active",inactive:"Expired / revoked",createdAt:"Created",revoke:"Revoke",empty:"No preview links yet.",preview:"preview",m15:"15 minutes",h1:"1 hour",h24:"24 hours",d7:"7 days"},
  ar:{back:"المحرر المرئي",title:"معاينة آمنة للمسودة",guard:"محمي برمز · المسودة فقط",created:"تم إنشاء رابط المعاينة",shownOnce:"يظهر هذا الرمز الآن فقط.",expires:"تنتهي الصلاحية",automatic:"تلقائياً",newLink:"إنشاء رابط معاينة آمن",create:"إنشاء المعاينة",hint:"يعرض الرابط آخر مسودة محفوظة ولا ينشر أي شيء.",history:"سجل المعاينات",active:"نشط",inactive:"منتهي / ملغى",createdAt:"تم الإنشاء",revoke:"إلغاء",empty:"لا توجد روابط معاينة بعد.",preview:"معاينة",m15:"15 دقيقة",h1:"ساعة واحدة",h24:"24 ساعة",d7:"7 أيام"},
};
const dateLocales:Record<AdminLocale,string>={fa:"fa-IR",tr:"tr-TR",en:"en-US",ar:"ar"};

function dateText(value:string,locale:AdminLocale){
  const date=new Date(value);
  return Number.isNaN(date.getTime())?"—":date.toLocaleString(dateLocales[locale]);
}

export default async function BuilderPreviewManager({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<{token?:string;expires?:string}>}){
  const {id}=await params;
  const {token="",expires=""}=await searchParams;
  const [bundle,rows,locale]=await Promise.all([
    adminRpc<BuilderBundle|null>("admin_page_builder_get",{p_page_id:id}),
    adminRpc<PreviewRow[]>("admin_builder_preview_list",{p_page_id:id}),
    currentAdminLocale(),
  ]);
  if(!bundle)return null;
  const t=text[locale];
  const rtl=locale==="fa"||locale==="ar";
  const title=(locale==="fa"?bundle.page.titleFa:locale==="tr"?bundle.page.titleTr:locale==="ar"?bundle.page.titleAr:bundle.page.titleEn)||bundle.page.titleEn||bundle.page.titleFa||bundle.page.slug;
  const create=createBuilderPreview.bind(null,id);
  const safeToken=/^[0-9a-f]{64}$/i.test(token)?token:"";
  return <div dir={rtl?"rtl":"ltr"} className="mx-auto max-w-5xl space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><Link href={`/admin/editor/${id}`} className="mb-3 inline-flex items-center gap-2 text-xs font-black text-muted"><ArrowLeft className={`h-4 w-4 ${rtl?"rotate-180":""}`}/>{t.back}</Link><h1 className="text-2xl font-black text-foreground">{t.title}</h1><p className="mt-1 text-sm text-muted">{title} · /{bundle.page.slug}</p></div>
      <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700"><ShieldCheck className="h-4 w-4"/>{t.guard}</div>
    </div>

    {safeToken?<div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5"><div className="mb-3 font-black text-emerald-900">{t.created}</div><p className="mb-4 text-xs text-emerald-800">{t.shownOnce} {t.expires} {expires?dateText(expires,locale):t.automatic}.</p><div className="grid gap-2 sm:grid-cols-2">{(["fa","tr","en","ar"] as const).map(previewLocale=><a key={previewLocale} target="_blank" rel="noreferrer" href={`/preview/${safeToken}/${previewLocale}`} className="flex min-h-11 items-center justify-between rounded-xl bg-white px-4 text-xs font-black text-emerald-900 shadow-sm"><span>{previewLocale.toUpperCase()} {t.preview}</span><ExternalLink className="h-4 w-4"/></a>)}</div></div>:null}

    <form action={create} className="rounded-2xl border border-border bg-card p-5"><div className="mb-4 flex items-center gap-2 font-black"><Link2 className="h-5 w-5"/>{t.newLink}</div><div className="flex flex-wrap gap-3"><select name="minutes" defaultValue="60" className="h-11 rounded-xl border border-border bg-background px-3 text-sm"><option value="15">{t.m15}</option><option value="60">{t.h1}</option><option value="1440">{t.h24}</option><option value="10080">{t.d7}</option></select><button className="h-11 rounded-xl bg-primary px-5 text-xs font-black text-white">{t.create}</button></div><p className="mt-3 text-xs text-muted">{t.hint}</p></form>

    <div className="rounded-2xl border border-border bg-card"><div className="border-b border-border p-4 text-sm font-black">{t.history}</div>{rows.length?<div className="divide-y divide-border">{rows.map(row=><div key={row.id} className="flex flex-wrap items-center gap-3 p-4"><div className="min-w-0 flex-1"><div className="text-sm font-bold">{row.active?t.active:t.inactive}</div><div className="mt-1 text-xs text-muted">{t.createdAt} {dateText(row.createdAt,locale)} · {t.expires} {dateText(row.expiresAt,locale)}</div></div>{row.active?<form action={revokeBuilderPreview.bind(null,id,row.id)}><button className="flex h-9 items-center gap-2 rounded-lg bg-rose-50 px-3 text-xs font-black text-rose-700"><XCircle className="h-4 w-4"/>{t.revoke}</button></form>:null}</div>)}</div>:<div className="p-8 text-center text-sm text-muted">{t.empty}</div>}</div>
  </div>;
}
