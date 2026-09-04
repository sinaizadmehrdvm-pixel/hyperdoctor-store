import Link from "next/link";
import { Search } from "lucide-react";
import { adminRpc } from "@/lib/admin-data";
import { currentAdminLocale } from "@/lib/admin-locale-server";
import { adminStatusText, type AdminLocale } from "@/lib/admin-i18n";

type Item={type:string;id:string;titleFa:string;titleTr:string;titleEn:string;titleAr:string;subtitle?:string|null;href:string;status?:string|null};
const C:Record<AdminLocale,Record<string,string>>={
  fa:{title:"جستجوی پنل مدیریت",subtitle:"جستجوی همزمان در محصولات، سفارش‌ها، مشتریان، خدمات، تیکت‌ها و مقالات",placeholder:"حداقل ۲ حرف وارد کنید",search:"جستجو",empty:"نتیجه‌ای پیدا نشد.",hint:"برای شروع حداقل ۲ حرف وارد کنید.",PRODUCT:"محصول",ORDER:"سفارش",CUSTOMER:"مشتری",SERVICE:"خدمت",SUPPORT:"تیکت",ARTICLE:"مقاله"},
  ar:{title:"البحث في لوحة الإدارة",subtitle:"بحث موحد في المنتجات والطلبات والعملاء والخدمات والتذاكر والمقالات",placeholder:"أدخل حرفين على الأقل",search:"بحث",empty:"لم يتم العثور على نتائج.",hint:"أدخل حرفين على الأقل للبدء.",PRODUCT:"منتج",ORDER:"طلب",CUSTOMER:"عميل",SERVICE:"خدمة",SUPPORT:"تذكرة",ARTICLE:"مقال"},
  en:{title:"Admin search",subtitle:"Search products, orders, customers, services, support tickets and articles together",placeholder:"Enter at least 2 characters",search:"Search",empty:"No results found.",hint:"Enter at least 2 characters to begin.",PRODUCT:"Product",ORDER:"Order",CUSTOMER:"Customer",SERVICE:"Service",SUPPORT:"Support ticket",ARTICLE:"Article"},
  tr:{title:"Yönetim paneli araması",subtitle:"Ürün, sipariş, müşteri, hizmet, destek talebi ve makalelerde tek arama",placeholder:"En az 2 karakter girin",search:"Ara",empty:"Sonuç bulunamadı.",hint:"Başlamak için en az 2 karakter girin.",PRODUCT:"Ürün",ORDER:"Sipariş",CUSTOMER:"Müşteri",SERVICE:"Hizmet",SUPPORT:"Destek talebi",ARTICLE:"Makale"}
};
const titleFor=(x:Item,l:AdminLocale)=>{const map={fa:x.titleFa,tr:x.titleTr,en:x.titleEn,ar:x.titleAr};return map[l]||x.titleFa||x.titleEn||x.subtitle||x.id};
export default async function AdminSearchPage({searchParams}:{searchParams:Promise<{q?:string}>}){
  const [{q=""},l]=await Promise.all([searchParams,currentAdminLocale()]);
  const query=q.trim().slice(0,100),t=C[l];
  const results=query.length>=2?await adminRpc<Item[]>("admin_global_search",{p_search:query}):[];
  return <div className="mx-auto max-w-5xl space-y-6">
    <div><h1 className="text-2xl font-black text-[#001736]">{t.title}</h1><p className="mt-2 text-sm text-[#747780]">{t.subtitle}</p></div>
    <form className="flex gap-2" action="/admin/search"><label className="relative flex-1"><Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9a9da5]"/><input autoFocus name="q" defaultValue={query} minLength={2} maxLength={100} placeholder={t.placeholder} className="h-12 w-full rounded-xl border border-[#dfe4ea] bg-white ps-10 pe-4 text-sm outline-none focus:border-[#009dd8]"/></label><button className="rounded-xl bg-[#001736] px-5 text-sm font-black text-white">{t.search}</button></form>
    {query.length<2?<div className="rounded-2xl border bg-white p-8 text-center text-sm text-[#747780]">{t.hint}</div>:results.length===0?<div className="rounded-2xl border bg-white p-8 text-center text-sm text-[#747780]">{t.empty}</div>:<div className="space-y-2">{results.map(x=><Link key={`${x.type}-${x.id}`} href={x.href} className="flex items-center gap-4 rounded-2xl border border-[#e2e6eb] bg-white p-4 transition hover:border-[#009dd8]/40 hover:shadow-sm"><span className="rounded-full bg-[#edf4ff] px-2.5 py-1 text-[10px] font-black text-[#002b5b]">{t[x.type]||x.type}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-black text-[#001736]">{titleFor(x,l)}</p>{x.subtitle?<p className="mt-1 truncate text-xs text-[#747780]" dir="auto">{x.subtitle}</p>:null}</div>{x.status?<span className="rounded-full bg-[#f5f7f9] px-2.5 py-1 text-[10px] font-black text-[#5f6570]">{adminStatusText(x.status,l)}</span>:null}</Link>)}</div>}
  </div>;
}
