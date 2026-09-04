import Image from "next/image";
import { Search } from "lucide-react";
import { adminRpc } from "@/lib/admin-data";
import { currentAdminLocale } from "@/lib/admin-locale-server";
import { adminDate, type AdminLocale } from "@/lib/admin-i18n";
import { MediaUploader } from "@/components/admin/media-uploader";
import { DeleteButton } from "@/components/admin/delete-button";
import { deleteMedia } from "./actions";

type MediaRow={id:string;url:string;altFa:string;altTr:string;altEn:string;altAr:string;width?:number|null;height?:number|null;createdAt:string};
const c:Record<AdminLocale,Record<string,string>>={
 fa:{eyebrow:"کتابخانه رسانه",title:"رسانه‌ها",untitled:"بدون عنوان",confirm:"این تصویر حذف شود؟",search:"جستجو",searchPlaceholder:"جستجو در عنوان یا آدرس فایل...",empty:"هنوز تصویری ثبت نشده است.",noMatch:"رسانه‌ای مطابق این جستجو پیدا نشد."},
 ar:{eyebrow:"مكتبة الوسائط",title:"الوسائط",untitled:"بدون عنوان",confirm:"هل تريد حذف هذه الصورة؟",search:"بحث",searchPlaceholder:"ابحث في العنوان أو رابط الملف...",empty:"لا توجد صور مسجلة بعد.",noMatch:"لم يتم العثور على وسائط مطابقة لهذا البحث."},
 en:{eyebrow:"Asset Library",title:"Media",untitled:"Untitled",confirm:"Delete this image?",search:"Search",searchPlaceholder:"Search alt text or file URL...",empty:"No image has been registered yet.",noMatch:"No media matched this search."},
 tr:{eyebrow:"Medya Kitaplığı",title:"Medya",untitled:"Başlıksız",confirm:"Bu görsel silinsin mi?",search:"Ara",searchPlaceholder:"Başlıkta veya dosya adresinde ara...",empty:"Henüz görsel kaydedilmedi.",noMatch:"Bu aramayla eşleşen medya bulunamadı."}
};
const localizedAlt=(m:MediaRow,l:AdminLocale)=>{const ordered=l==="fa"?[m.altFa,m.altAr,m.altEn,m.altTr]:l==="ar"?[m.altAr,m.altFa,m.altEn,m.altTr]:l==="tr"?[m.altTr,m.altEn,m.altFa,m.altAr]:[m.altEn,m.altTr,m.altFa,m.altAr];return ordered.find(Boolean)||"";};

export default async function AdminMediaPage({searchParams}:{searchParams:Promise<{q?:string}>}){
 const {q=""}=await searchParams;
 const [media,l]=await Promise.all([adminRpc<MediaRow[]>("admin_media_search",{p_search:q}),currentAdminLocale()]);
 const t=c[l];
 return <div className="space-y-6">
  <div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[.16em] text-muted">{t.eyebrow}</p><h1 className="mt-2 text-2xl font-black text-foreground">{t.title}</h1></div><MediaUploader/></div>
  <form className="flex gap-3 rounded-2xl border border-border bg-card p-4"><label className="relative flex-1"><Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"/><input name="q" defaultValue={q} placeholder={t.searchPlaceholder} className="h-11 w-full rounded-xl border border-border bg-background ps-10 pe-3 text-sm outline-none focus:border-primary"/></label><button className="h-11 rounded-xl bg-foreground px-5 text-xs font-black text-background">{t.search}</button></form>
  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">{media.map(m=>{const alt=localizedAlt(m,l);return <article key={m.id} className="group overflow-hidden rounded-2xl border border-border bg-card shadow-sm"><div className="relative aspect-square bg-muted-bg"><Image src={m.url} alt={alt||"media"} fill className="object-cover"/></div><div className="flex items-center justify-between gap-2 p-2"><div className="min-w-0"><p className="truncate text-[11px] font-bold text-foreground">{alt||t.untitled}</p><p className="truncate text-[9px] text-muted" dir="ltr">{m.width&&m.height?`${m.width}×${m.height}`:adminDate(m.createdAt,l)}</p></div><DeleteButton action={deleteMedia.bind(null,m.id)} confirmMessage={t.confirm}/></div></article>})}{media.length===0?<p className="col-span-full rounded-2xl border border-dashed border-border p-12 text-center text-sm text-muted">{q?t.noMatch:t.empty}</p>:null}</div>
 </div>;
}
