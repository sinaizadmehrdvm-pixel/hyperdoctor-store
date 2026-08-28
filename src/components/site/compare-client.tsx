"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { GitCompareArrows, ImageOff, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { formatPrice } from "@/lib/utils";
import { localizedName } from "@/lib/i18n-content";

const STORAGE_KEY = "hd_compare_products";

type Product = {
  id: string;
  slug: string;
  nameFa: string;
  nameTr?: string | null;
  nameEn: string;
  nameAr?: string | null;
  price: number;
  compareAtPrice?: number | null;
  stock: number;
  sku?: string | null;
  modelNumber?: string | null;
  brand?: string | null;
  manufacturer?: string | null;
  countryOfOrigin?: string | null;
  warrantyMonths?: number | null;
  weightGrams?: number | null;
  specs?: unknown;
  images?: Array<{ url: string; altFa?: string | null; altTr?: string | null; altEn?: string | null; altAr?: string | null }>;
};

function l(locale: string, fa: string, en: string, tr: string, ar: string) {
  if (locale === "en") return en;
  if (locale === "tr") return tr;
  if (locale === "ar") return ar;
  return fa;
}

function readIds() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string").slice(0, 4) : [];
  } catch {
    return [];
  }
}

export function CompareClient({ products }: { products: Product[] }) {
  const locale = useLocale();
  const c = useTranslations("common");
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    setIds(readIds());
    const sync = () => setIds(readIds());
    window.addEventListener("hd-compare-change", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("hd-compare-change", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const selected = useMemo(() => ids.map((id) => products.find((p) => p.id === id)).filter((p): p is Product => Boolean(p)), [ids, products]);

  function remove(id: string) {
    const next = ids.filter((value) => value !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setIds(next);
    window.dispatchEvent(new Event("hd-compare-change"));
  }

  function clear() {
    localStorage.removeItem(STORAGE_KEY);
    setIds([]);
    window.dispatchEvent(new Event("hd-compare-change"));
  }

  if (!selected.length) {
    return <section className="rounded-[2rem] border border-dashed border-[#c4c6d0] bg-white p-10 text-center shadow-sm sm:p-16"><span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#edf4ff] text-[#002b5b]"><GitCompareArrows className="h-7 w-7" /></span><h2 className="mt-5 text-xl font-black text-[#001736]">{l(locale,"هنوز محصولی برای مقایسه انتخاب نشده است","No products selected for comparison","Karşılaştırma için ürün seçilmedi","لم يتم اختيار منتجات للمقارنة")}</h2><p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-[#747780]">{l(locale,"در فروشگاه روی آیکن مقایسه هر محصول بزنید. حداکثر چهار محصول را می‌توانید هم‌زمان مقایسه کنید.","Use the compare icon on product cards. You can compare up to four products at once.","Ürün kartlarındaki karşılaştır simgesini kullanın. Aynı anda en fazla dört ürün karşılaştırabilirsiniz.","استخدم أيقونة المقارنة في بطاقات المنتجات. يمكنك مقارنة أربعة منتجات كحد أقصى.")}</p><Link href="/shop" className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-[#ba0036] px-5 text-sm font-black text-white">{l(locale,"رفتن به فروشگاه","Go to shop","Mağazaya git","الذهاب إلى المتجر")}</Link></section>;
  }

  const rows = [
    [l(locale,"برند","Brand","Marka","العلامة"), (p: Product) => p.brand || "—"],
    [l(locale,"مدل","Model","Model","الموديل"), (p: Product) => p.modelNumber || "—"],
    ["SKU", (p: Product) => p.sku || "—"],
    [l(locale,"موجودی","Stock","Stok","المخزون"), (p: Product) => p.stock > 0 ? l(locale,`${p.stock} عدد`,`${p.stock} in stock`,`${p.stock} stokta`,`${p.stock} متوفر`) : l(locale,"ناموجود","Out of stock","Stokta yok","غير متوفر")],
    [l(locale,"گارانتی","Warranty","Garanti","الضمان"), (p: Product) => p.warrantyMonths ? l(locale,`${p.warrantyMonths} ماه`,`${p.warrantyMonths} months`,`${p.warrantyMonths} ay`,`${p.warrantyMonths} شهر`) : "—"],
    [l(locale,"سازنده","Manufacturer","Üretici","المصنع"), (p: Product) => p.manufacturer || "—"],
    [l(locale,"کشور سازنده","Country of origin","Menşei","بلد المنشأ"), (p: Product) => p.countryOfOrigin || "—"],
    [l(locale,"وزن","Weight","Ağırlık","الوزن"), (p: Product) => p.weightGrams ? `${p.weightGrams} g` : "—"],
  ] as const;

  return <div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-[#747780]">{l(locale,`${selected.length} محصول انتخاب شده`,`${selected.length} products selected`,`${selected.length} ürün seçildi`,`${selected.length} منتجات محددة`)}</p><button type="button" onClick={clear} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#ffd5df] bg-white px-4 text-xs font-black text-[#ba0036]"><Trash2 className="h-4 w-4" />{l(locale,"پاک کردن مقایسه","Clear comparison","Karşılaştırmayı temizle","مسح المقارنة")}</button></div>
    <div className="overflow-x-auto rounded-[1.7rem] border border-[#dfe4ea] bg-white shadow-[0_14px_38px_rgba(0,23,54,.05)]">
      <table className="w-full min-w-[760px] border-collapse text-sm"><thead><tr><th className="w-40 border-b border-e border-[#e6e9ed] bg-[#f7fafd] p-4 text-start text-xs font-black text-[#747780]">{l(locale,"مشخصه","Attribute","Özellik","الخاصية")}</th>{selected.map((p)=><th key={p.id} className="min-w-48 border-b border-e border-[#e6e9ed] p-4 align-top last:border-e-0"><div className="relative mx-auto aspect-square max-w-36 overflow-hidden rounded-2xl bg-[#f1f4f7]">{p.images?.[0]?.url?<Image src={p.images[0].url} alt={localizedName(locale,p)} fill className="object-contain p-3" sizes="144px"/>:<div className="flex h-full items-center justify-center text-[#9aa0aa]"><ImageOff className="h-7 w-7"/></div>}</div><Link href={`/product/${p.slug}`} className="mt-3 block line-clamp-2 font-black leading-6 text-[#001736] hover:text-[#ba0036]">{localizedName(locale,p)}</Link><div className="mt-2 text-base font-black text-[#ba0036]">{formatPrice(p.price,locale)} <span className="text-[10px] text-[#747780]">{c("currency")}</span></div><button type="button" onClick={()=>remove(p.id)} className="mt-3 text-[11px] font-black text-[#747780] hover:text-[#ba0036]">{l(locale,"حذف از مقایسه","Remove","Kaldır","إزالة")}</button></th>)}</tr></thead><tbody>{rows.map(([label,get])=><tr key={label}><th className="border-b border-e border-[#edf0f2] bg-[#fafcff] p-4 text-start text-xs font-black text-[#5f6570]">{label}</th>{selected.map(p=><td key={`${label}-${p.id}`} className="border-b border-e border-[#edf0f2] p-4 text-center font-bold text-[#001736] last:border-e-0" dir={label === "SKU" ? "ltr" : undefined}>{get(p)}</td>)}</tr>)}</tbody></table>
    </div>
  </div>;
}
