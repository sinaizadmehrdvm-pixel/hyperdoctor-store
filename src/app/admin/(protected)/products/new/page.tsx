import Link from "next/link";
import { ChevronLeft, ChevronRight, Database, PackagePlus } from "lucide-react";
import { ProductForm } from "@/components/admin/product-form";
import { currentAdminLocale } from "@/lib/admin-locale-server";
import type { AdminLocale } from "@/lib/admin-i18n";

const copy: Record<AdminLocale, { eyebrow:string; title:string; desc:string; back:string; steps:[string,string,string] }> = {
  fa:{eyebrow:"پایگاه داده کاتالوگ",title:"افزودن محصول جدید",desc:"اطلاعات پایه، قیمت و موجودی، تصاویر، مشخصات فنی، SEO و انتشار چهارزبانه",back:"بازگشت به محصولات",steps:["اطلاعات و شناسه‌ها","تصاویر و مشخصات فنی","SEO و انتشار"]},
  ar:{eyebrow:"قاعدة بيانات الكتالوج",title:"إضافة منتج جديد",desc:"البيانات الأساسية والسعر والمخزون والصور والمواصفات وSEO والنشر بأربع لغات",back:"العودة إلى المنتجات",steps:["البيانات والمعرّفات","الصور والمواصفات الفنية","SEO والنشر"]},
  en:{eyebrow:"Catalog database",title:"Add new product",desc:"Core data, pricing, inventory, images, technical specifications, SEO and four-language publishing",back:"Back to products",steps:["Data and identifiers","Images and technical specs","SEO and publishing"]},
  tr:{eyebrow:"Katalog veritabanı",title:"Yeni ürün ekle",desc:"Temel bilgiler, fiyat, stok, görseller, teknik özellikler, SEO ve dört dilde yayınlama",back:"Ürünlere dön",steps:["Bilgiler ve tanımlayıcılar","Görseller ve teknik özellikler","SEO ve yayınlama"]},
};

export default async function NewProductPage() {
  const locale=await currentAdminLocale();const t=copy[locale];const Arrow=locale==="fa"||locale==="ar"?ChevronLeft:ChevronRight;
  return <div className="mx-auto max-w-[1450px]"><div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><p className="flex items-center gap-2 text-xs font-black uppercase tracking-[.12em] text-[#e80346]"><Database className="h-4 w-4" aria-hidden="true"/>{t.eyebrow}</p><h1 className="mt-2 text-3xl font-black text-[#001736]">{t.title}</h1><p className="mt-2 text-sm text-[#747780]">{t.desc}</p></div><Link href="/admin/products" className="vitalis-focus inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#dfe4ea] bg-white px-4 text-xs font-black text-[#001736]"><Arrow className="h-4 w-4" aria-hidden="true"/>{t.back}</Link></div><div className="mb-5 grid gap-3 sm:grid-cols-3">{t.steps.map((step,index)=><div key={step} className="rounded-2xl border border-[#e2e6eb] bg-white p-4"><span className={`flex h-9 w-9 items-center justify-center rounded-xl ${index===0?"bg-[#001736] text-white":index===1?"bg-[#edf4ff] text-[#002b5b]":"bg-[#fff0f3] text-[#e80346]"}`}>{index===0?<PackagePlus className="h-4 w-4" aria-hidden="true"/>:index+1}</span><p className="mt-3 text-xs font-black text-[#001736]">{index+1}. {step}</p></div>)}</div><ProductForm /></div>;
}
