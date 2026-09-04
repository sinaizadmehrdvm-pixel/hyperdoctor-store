import Link from "next/link";
import { Pencil, Plus, Search } from "lucide-react";
import { DeleteButton } from "@/components/admin/delete-button";
import { adminRpc } from "@/lib/admin-data";
import { currentAdminLocale } from "@/lib/admin-locale-server";
import { adminNumber, type AdminLocale } from "@/lib/admin-i18n";
import { deleteCategory } from "./actions";
import { verticalLabel, verticalOptions } from "@/lib/verticals";

type CategoryRow={id:string;vertical:string;slug:string;nameFa:string;nameTr:string;nameEn:string;nameAr:string;order:number;isPublished:boolean;productCount:number};
const c:Record<AdminLocale,Record<string,string>>={
 fa:{eyebrow:"ساختار کاتالوگ",title:"دسته‌بندی‌ها",new:"دسته‌بندی جدید",name:"نام",vertical:"حوزه",product:"محصول",publish:"انتشار",published:"منتشرشده",draft:"پیش‌نویس",all:"همه",search:"جستجو",searchPlaceholder:"نام، توضیح یا slug...",status:"وضعیت",empty:"هنوز دسته‌بندی‌ای ثبت نشده است.",noMatch:"دسته‌بندی مطابق این فیلترها پیدا نشد."},
 ar:{eyebrow:"هيكل الكتالوج",title:"التصنيفات",new:"تصنيف جديد",name:"الاسم",vertical:"المجال",product:"المنتجات",publish:"النشر",published:"منشور",draft:"مسودة",all:"الكل",search:"بحث",searchPlaceholder:"الاسم أو الوصف أو slug...",status:"الحالة",empty:"لا توجد تصنيفات بعد.",noMatch:"لم يتم العثور على تصنيف مطابق لهذه المرشحات."},
 en:{eyebrow:"Catalog structure",title:"Categories",new:"New category",name:"Name",vertical:"Vertical",product:"Products",publish:"Publishing",published:"Published",draft:"Draft",all:"All",search:"Search",searchPlaceholder:"Name, description or slug...",status:"Status",empty:"No categories have been added yet.",noMatch:"No category matched these filters."},
 tr:{eyebrow:"Katalog yapısı",title:"Kategoriler",new:"Yeni kategori",name:"Ad",vertical:"Alan",product:"Ürün",publish:"Yayın",published:"Yayında",draft:"Taslak",all:"Tümü",search:"Ara",searchPlaceholder:"Ad, açıklama veya slug...",status:"Durum",empty:"Henüz kategori eklenmedi.",noMatch:"Bu filtrelerle eşleşen kategori bulunamadı."}
};
const localizedName=(x:CategoryRow,l:AdminLocale)=>{const ordered=l==="fa"?[x.nameFa,x.nameAr,x.nameEn,x.nameTr]:l==="ar"?[x.nameAr,x.nameFa,x.nameEn,x.nameTr]:l==="tr"?[x.nameTr,x.nameEn,x.nameFa,x.nameAr]:[x.nameEn,x.nameTr,x.nameFa,x.nameAr];return ordered.find(Boolean)||x.slug;};

export default async function Page({searchParams}:{searchParams:Promise<{q?:string;status?:string;vertical?:string}>}){
 const {q="",status="",vertical=""}=await searchParams;
 const [cats,l]=await Promise.all([adminRpc<CategoryRow[]>("admin_categories_search",{p_search:q,p_status:status,p_vertical:vertical}),currentAdminLocale()]);
 const t=c[l],verticals=verticalOptions(l),filtered=Boolean(q||status||vertical);
 return <div className="space-y-6">
  <div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[.16em] text-muted">{t.eyebrow}</p><h1 className="mt-2 text-2xl font-black">{t.title}</h1></div><Link href="/admin/categories/new" className="flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-black text-white"><Plus className="h-4 w-4"/>{t.new}</Link></div>
  <form className="grid gap-3 rounded-2xl border bg-card p-4 md:grid-cols-[1fr_180px_220px_auto]"><label className="relative"><Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"/><input name="q" defaultValue={q} placeholder={t.searchPlaceholder} className="h-11 w-full rounded-xl border bg-background ps-10 pe-3 text-sm outline-none focus:border-primary"/></label><select name="status" defaultValue={status} className="h-11 rounded-xl border bg-background px-3 text-sm"><option value="">{t.all} · {t.status}</option><option value="PUBLISHED">{t.published}</option><option value="DRAFT">{t.draft}</option></select><select name="vertical" defaultValue={vertical} className="h-11 rounded-xl border bg-background px-3 text-sm"><option value="">{t.all} · {t.vertical}</option>{verticals.map(v=><option key={v.value} value={v.value}>{v.label}</option>)}</select><button className="h-11 rounded-xl bg-foreground px-5 text-xs font-black text-background">{t.search}</button></form>
  <div className="overflow-x-auto rounded-2xl border bg-card"><table className="w-full min-w-[780px] text-sm"><thead><tr className="border-b text-xs text-muted">{[t.name,t.vertical,t.product,t.publish,""].map((x,i)=><th key={i} className="px-4 py-3 text-start">{x}</th>)}</tr></thead><tbody>{cats.map(x=><tr key={x.id} className="border-b last:border-0"><td className="px-4 py-3"><b>{localizedName(x,l)}</b><div className="mt-1 text-xs text-muted" dir="ltr">/{x.slug}</div></td><td className="px-4 py-3">{verticalLabel(x.vertical,l)}</td><td className="px-4 py-3">{adminNumber(x.productCount,l)}</td><td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${x.isPublished?"bg-emerald-50 text-emerald-700":"bg-muted-bg text-muted"}`}>{x.isPublished?t.published:t.draft}</span></td><td className="px-4 py-3"><div className="flex justify-end gap-1"><Link href={`/admin/categories/${x.id}`} className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-muted-bg"><Pencil className="h-4 w-4"/></Link><DeleteButton action={deleteCategory.bind(null,x.id)}/></div></td></tr>)}{!cats.length?<tr><td colSpan={5} className="px-4 py-12 text-center text-muted">{filtered?t.noMatch:t.empty}</td></tr>:null}</tbody></table></div>
 </div>;
}
