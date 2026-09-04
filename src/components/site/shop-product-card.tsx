"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Heart, ImageOff, ShoppingCart, Check, GitCompareArrows } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useCart } from "@/lib/cart-context";
import { formatPrice } from "@/lib/utils";
import { localizedAlt, localizedName } from "@/lib/i18n-content";

const COMPARE_KEY = "hd_compare_products";
const FAVORITE_KEY = "hd_favorite_products";

type ShopProduct = {
  id: string;
  slug: string;
  nameFa: string;
  nameTr?: string | null;
  nameEn: string;
  nameAr?: string | null;
  price: number;
  compareAtPrice?: number | null;
  stock: number;
  brand?: string | null;
  brandEntity?: { name: string } | null;
  isNewArrival?: boolean;
  images?: {
    url: string;
    altFa: string;
    altTr?: string | null;
    altEn: string;
    altAr?: string | null;
  }[];
};

function readStored(key: string) {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) || "[]");
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

function l(locale: string, fa: string, en: string, tr: string, ar: string) {
  if (locale === "en") return en;
  if (locale === "tr") return tr;
  if (locale === "ar") return ar;
  return fa;
}

export function ShopProductCard({ product, compact = false }: { product: ShopProduct; compact?: boolean }) {
  const locale = useLocale();
  const t = useTranslations("shop");
  const c = useTranslations("common");
  const { add } = useCart();
  const [added, setAdded] = useState(false);
  const [favorite, setFavorite] = useState(false);
  const [compared, setCompared] = useState(false);
  const [compareLimit, setCompareLimit] = useState(false);
  const name = localizedName(locale, product);
  const image = product.images?.[0];
  const disabled = product.stock <= 0;
  const hasDiscount = Boolean(product.compareAtPrice && product.compareAtPrice > product.price);
  const discountPercent = hasDiscount && product.compareAtPrice
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0;

  useEffect(() => {
    setFavorite(readStored(FAVORITE_KEY).includes(product.id));
    setCompared(readStored(COMPARE_KEY).includes(product.id));
    const sync = () => setCompared(readStored(COMPARE_KEY).includes(product.id));
    window.addEventListener("hd-compare-change", sync);
    return () => window.removeEventListener("hd-compare-change", sync);
  }, [product.id]);

  function toggleFavorite() {
    const current = readStored(FAVORITE_KEY);
    const next = current.includes(product.id) ? current.filter((id) => id !== product.id) : [...current, product.id];
    localStorage.setItem(FAVORITE_KEY, JSON.stringify(next));
    setFavorite(next.includes(product.id));
  }

  function toggleCompare() {
    const current = readStored(COMPARE_KEY).slice(0, 5);
    let next: string[];
    if (current.includes(product.id)) {
      next = current.filter((id) => id !== product.id);
      setCompareLimit(false);
    } else if (current.length >= 5) {
      setCompareLimit(true);
      window.setTimeout(() => setCompareLimit(false), 1800);
      return;
    } else {
      next = [...current, product.id];
      setCompareLimit(false);
    }
    localStorage.setItem(COMPARE_KEY, JSON.stringify(next));
    setCompared(next.includes(product.id));
    window.dispatchEvent(new Event("hd-compare-change"));
  }

  const newLabel = l(locale, "جدید", "New", "Yeni", "جديد");
  const discountLabel = l(locale, `${discountPercent}٪ تخفیف`, `${discountPercent}% off`, `%${discountPercent} indirim`, `خصم ${discountPercent}٪`);
  const compareLimitText = l(locale, "حداکثر پنج محصول را می‌توانید مقایسه کنید", "You can compare up to five products", "En fazla beş ürünü karşılaştırabilirsiniz", "يمكنك مقارنة خمسة منتجات كحد أقصى");
  const brandName=product.brandEntity?.name||product.brand||"";

  return (
    <article className="group relative flex min-h-full flex-col overflow-hidden rounded-[1.2rem] border border-[#e0e3e6] bg-white p-2.5 shadow-[0_8px_26px_rgba(0,23,54,.06)] transition duration-300 hover:-translate-y-1 hover:border-[#c4c6d0] hover:shadow-[0_18px_42px_rgba(0,23,54,.12)] focus-within:border-[#009dd8] focus-within:shadow-[0_0_0_3px_rgba(0,157,216,.12),0_18px_42px_rgba(0,23,54,.1)] sm:p-3">
      <div className={`relative overflow-hidden rounded-[.95rem] bg-gradient-to-b from-[#f7fafd] to-[#eef2f6] ${compact ? "aspect-[1.18/1]" : "aspect-[1.08/1]"}`}>
        <Link href={`/product/${product.slug}`} className="absolute inset-0 z-10 rounded-[.95rem] vitalis-focus" aria-label={name} />
        {image ? <Image src={image.url} alt={localizedAlt(locale, image, name)} fill className="object-contain p-3 transition-transform duration-500 group-hover:scale-[1.035]" sizes="(min-width:1280px) 230px, (min-width:768px) 30vw, 48vw" /> : <div className="flex h-full flex-col items-center justify-center gap-2 text-[#9aa0aa]"><ImageOff className="h-8 w-8" /><span className="text-[10px] font-bold">{l(locale,"تصویر ثبت نشده","No image","Görsel yok","لا توجد صورة")}</span></div>}
        <button type="button" onClick={toggleFavorite} aria-pressed={favorite} aria-label={favorite ? l(locale,"حذف از علاقه‌مندی‌ها","Remove from favorites","Favorilerden çıkar","إزالة من المفضلة") : l(locale,"افزودن به علاقه‌مندی‌ها","Add to favorites","Favorilere ekle","إضافة إلى المفضلة")} className={`vitalis-focus absolute start-2.5 top-2.5 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/70 bg-white/90 shadow-sm backdrop-blur transition ${favorite ? "text-[#ba0036]" : "text-[#747780] hover:text-[#ba0036]"}`}><Heart className={`h-4 w-4 ${favorite ? "fill-current" : ""}`} /></button>
        <div className="absolute end-2.5 top-2.5 z-20 flex flex-col items-end gap-1.5">
          {product.isNewArrival ? <span className="rounded-full bg-[#001736] px-2.5 py-1 text-[10px] font-black text-white shadow-sm">{newLabel}</span> : null}
          {hasDiscount ? <span className="rounded-full bg-[#ba0036] px-2.5 py-1 text-[10px] font-black text-white shadow-sm">{discountLabel}</span> : null}
        </div>
      </div>

      <div className="flex flex-1 flex-col px-1.5 pb-1 pt-3">
        {brandName ? <p className="mb-1 truncate text-[10px] font-black uppercase tracking-[.1em] text-[#747780]">{brandName}</p> : null}
        <Link href={`/product/${product.slug}`} className="vitalis-focus line-clamp-2 min-h-12 rounded-md text-sm font-black leading-6 text-[#181c1e] transition hover:text-[#002b5b]">{name}</Link>
        <div className="mt-2 flex min-h-10 flex-wrap items-baseline gap-x-1.5 gap-y-1 tabular-nums"><strong className="text-[15px] font-black text-[#ba0036] sm:text-base">{formatPrice(product.price, locale)}</strong><span className="text-[10px] font-bold text-[#747780]">{c("currency")}</span>{hasDiscount && product.compareAtPrice ? <span className="text-[10px] text-[#9aa0aa] line-through">{formatPrice(product.compareAtPrice, locale)}</span> : null}</div>

        <div className="mt-auto grid grid-cols-[1fr_auto] gap-2 pt-3">
          <button type="button" disabled={disabled} onClick={() => { add({ type: "product", id: product.id, nameFa: product.nameFa, nameTr: product.nameTr ?? undefined, nameEn: product.nameEn, nameAr: product.nameAr ?? undefined, price: product.price, image: image?.url ?? null, quantity: 1 }); setAdded(true); window.setTimeout(() => setAdded(false), 1300); }} className="vitalis-focus flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-[#002b5b] bg-[#002b5b] px-2.5 text-[11px] font-black text-white transition hover:bg-[#001736] disabled:cursor-not-allowed disabled:border-[#c4c6d0] disabled:bg-[#eef1f4] disabled:text-[#747780] sm:px-3 sm:text-xs" aria-live="polite">{added ? <Check className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}<span>{disabled ? t("outOfStock") : added ? l(locale,"اضافه شد","Added","Eklendi","تمت الإضافة") : t("addToCart")}</span></button>
          <button type="button" onClick={toggleCompare} aria-pressed={compared} title={compareLimit ? compareLimitText : undefined} aria-label={compared ? l(locale,"حذف از مقایسه","Remove from comparison","Karşılaştırmadan çıkar","إزالة من المقارنة") : l(locale,"افزودن به مقایسه","Add to comparison","Karşılaştırmaya ekle","إضافة إلى المقارنة")} className={`vitalis-focus relative flex h-11 w-11 items-center justify-center rounded-xl border bg-white transition ${compared ? "border-[#009dd8] bg-[#edf8ff] text-[#002b5b]" : compareLimit ? "border-[#ba0036] bg-[#fff4f6] text-[#ba0036]" : "border-[#d7dbe0] text-[#747780] hover:border-[#009dd8] hover:text-[#002b5b]"}`}><GitCompareArrows className="h-4 w-4" /></button>
        </div>
        <p className={`min-h-5 pt-1 text-center text-[10px] font-bold text-[#ba0036] transition-opacity ${compareLimit ? "opacity-100" : "opacity-0"}`} role="status" aria-live="polite">{compareLimit ? compareLimitText : ""}</p>
      </div>
    </article>
  );
}
