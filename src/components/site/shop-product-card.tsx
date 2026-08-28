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
    const current = readStored(COMPARE_KEY).slice(0, 4);
    let next: string[];
    if (current.includes(product.id)) {
      next = current.filter((id) => id !== product.id);
      setCompareLimit(false);
    } else if (current.length >= 4) {
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

  return (
    <article className="group relative flex min-h-full flex-col overflow-hidden rounded-[1.15rem] border border-[#e0e3e6] bg-white p-2.5 shadow-[0_10px_30px_rgba(0,23,54,.07)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_42px_rgba(0,23,54,.12)] sm:p-3">
      <div className={`relative overflow-hidden rounded-[.9rem] bg-[#f1f4f7] ${compact ? "aspect-[1.18/1]" : "aspect-[1.08/1]"}`}>
        <Link href={`/product/${product.slug}`} className="absolute inset-0 z-10" aria-label={name} />
        {image ? <Image src={image.url} alt={localizedAlt(locale, image, name)} fill className="object-contain p-3 transition-transform duration-500 group-hover:scale-[1.035]" sizes="(min-width:1280px) 230px, (min-width:768px) 30vw, 48vw" /> : <div className="flex h-full items-center justify-center text-[#9aa0aa]"><ImageOff className="h-8 w-8" /></div>}
        <button type="button" onClick={toggleFavorite} aria-pressed={favorite} aria-label={favorite ? l(locale,"حذف از علاقه‌مندی‌ها","Remove from favorites","Favorilerden çıkar","إزالة من المفضلة") : l(locale,"افزودن به علاقه‌مندی‌ها","Add to favorites","Favorilere ekle","إضافة إلى المفضلة")} className={`absolute start-2.5 top-2.5 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white/88 shadow-sm backdrop-blur transition ${favorite ? "text-[#ba0036]" : "text-[#aeb4bd] hover:text-[#ba0036]"}`}><Heart className={`h-4 w-4 ${favorite ? "fill-current" : ""}`} /></button>
        {product.isNewArrival ? <span className="absolute end-2.5 top-2.5 z-20 rounded-full bg-[#ba0036] px-2.5 py-1 text-[10px] font-black text-white">NEW</span> : null}
      </div>

      <div className="flex flex-1 flex-col px-1.5 pb-1 pt-3">
        {product.brand ? <p className="mb-1 text-[10px] font-black uppercase tracking-[.12em] text-[#747780]">{product.brand}</p> : null}
        <Link href={`/product/${product.slug}`} className="line-clamp-2 min-h-12 text-sm font-black leading-6 text-[#181c1e] transition hover:text-[#002b5b]">{name}</Link>
        <div className="mt-2 flex flex-wrap items-baseline gap-x-1.5 gap-y-1 tabular-nums"><strong className="text-[15px] font-black text-[#ba0036] sm:text-base">{formatPrice(product.price, locale)}</strong><span className="text-[10px] font-bold text-[#747780]">{c("currency")}</span>{product.compareAtPrice ? <span className="text-[10px] text-[#9aa0aa] line-through">{formatPrice(product.compareAtPrice, locale)}</span> : null}</div>

        <div className="mt-auto grid grid-cols-[1fr_auto] gap-2 pt-3">
          <button type="button" disabled={disabled} onClick={() => { add({ type: "product", id: product.id, nameFa: product.nameFa, nameTr: product.nameTr ?? undefined, nameEn: product.nameEn, nameAr: product.nameAr ?? undefined, price: product.price, image: image?.url ?? null, quantity: 1 }); setAdded(true); window.setTimeout(() => setAdded(false), 1300); }} className="vitalis-focus flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-[#002b5b] bg-[#002b5b] px-3 text-xs font-black text-white transition hover:bg-[#001736] disabled:cursor-not-allowed disabled:border-[#c4c6d0] disabled:bg-[#eef1f4] disabled:text-[#9aa0aa]">{added ? <Check className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}<span>{disabled ? t("outOfStock") : t("addToCart")}</span></button>
          <button type="button" onClick={toggleCompare} aria-pressed={compared} title={compareLimit ? l(locale,"حداکثر چهار محصول","Maximum four products","En fazla dört ürün","أربعة منتجات كحد أقصى") : undefined} aria-label={compared ? l(locale,"حذف از مقایسه","Remove from comparison","Karşılaştırmadan çıkar","إزالة من المقارنة") : l(locale,"افزودن به مقایسه","Add to comparison","Karşılaştırmaya ekle","إضافة إلى المقارنة")} className={`vitalis-focus relative flex h-10 w-10 items-center justify-center rounded-xl border bg-white transition ${compared ? "border-[#009dd8] bg-[#edf8ff] text-[#002b5b]" : compareLimit ? "border-[#ba0036] text-[#ba0036]" : "border-[#d7dbe0] text-[#747780] hover:border-[#009dd8] hover:text-[#002b5b]"}`}><GitCompareArrows className="h-4 w-4" /><span className="sr-only">{compareLimit ? l(locale,"حد مقایسه تکمیل است","Comparison limit reached","Karşılaştırma sınırına ulaşıldı","تم الوصول إلى حد المقارنة") : ""}</span></button>
        </div>
      </div>
    </article>
  );
}
