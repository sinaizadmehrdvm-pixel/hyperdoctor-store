import { getLocale } from "next-intl/server";
import { GitCompareArrows } from "lucide-react";
import { Container } from "@/components/ui/container";
import { CompareClient } from "@/components/site/compare-client";
import { getProducts } from "@/lib/queries";

function l(locale:string,fa:string,en:string,tr:string,ar:string){if(locale==="en")return en;if(locale==="tr")return tr;if(locale==="ar")return ar;return fa;}

export default async function ComparePage(){
  const locale=await getLocale();
  const products=await getProducts();
  return <main className="flex-1 bg-[#f7fafd] py-8 sm:py-12"><Container><div className="mb-7 flex items-start gap-4"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#001736] text-white"><GitCompareArrows className="h-5 w-5"/></span><div><p className="text-xs font-black uppercase tracking-[.16em] text-[#ba0036]">HYPER DOCTOR COMPARE</p><h1 className="mt-2 text-3xl font-black text-[#001736]">{l(locale,"مقایسه تجهیزات پزشکی","Compare medical equipment","Medikal ekipman karşılaştırma","مقارنة المعدات الطبية")}</h1><p className="mt-2 max-w-2xl text-sm leading-7 text-[#747780]">{l(locale,"محصولات انتخاب‌شده را بر اساس اطلاعات واقعی ثبت‌شده در کاتالوگ مقایسه کنید.","Compare selected products using the real catalog data stored for each item.","Seçilen ürünleri katalogdaki gerçek verilerle karşılaştırın.","قارن المنتجات المحددة باستخدام بيانات الكتالوج الحقيقية.")}</p></div></div><CompareClient products={products}/></Container></main>;
}
