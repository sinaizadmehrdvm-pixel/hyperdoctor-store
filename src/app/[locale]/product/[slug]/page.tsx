import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/container";
import { ProductGallery } from "@/components/site/product-gallery";
import { AddToCartButton } from "@/components/site/add-to-cart-button";
import { ShopProductCard } from "@/components/site/shop-product-card";
import { formatPrice } from "@/lib/utils";
import { localizedDescription, localizedName, pickLocalized } from "@/lib/i18n-content";
import { getProductBySlug, getRelatedProducts } from "@/lib/queries";
import {
  BadgeCheck,
  Box,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  GitCompareArrows,
  Heart,
  PackageCheck,
  ShieldCheck,
  Star,
  Truck,
  Volume2,
  Weight,
  Droplets,
  Headphones,
} from "lucide-react";

type LocalizedSpec = string | { fa?: string; tr?: string; en?: string; ar?: string };
type Specs = Record<string, LocalizedSpec>;
type ProductReview = { id: string; authorName: string; rating: number; title?: string | null; body?: string | null };

function l(locale: string, fa: string, en: string, tr: string, ar: string) {
  if (locale === "en") return en;
  if (locale === "tr") return tr;
  if (locale === "ar") return ar;
  return fa;
}
function localizedSpecValue(locale: string, value: LocalizedSpec) { return typeof value === "string" ? value : pickLocalized(locale, value); }

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [locale, t, c] = await Promise.all([getLocale(), getTranslations("shop"), getTranslations("common")]);
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const related = await getRelatedProducts(product.categoryId, product.id);
  let specs: Specs = {};
  try { specs = typeof product.specs === "string" ? JSON.parse(product.specs) as Specs : (product.specs ?? {}) as Specs; } catch { specs = {}; }
  const specEntries = Object.entries(specs);
  const name = localizedName(locale, product);
  const description = localizedDescription(locale, product);
  const categoryName = product.category ? localizedName(locale, product.category) : "";
  const image = product.images?.[0];
  const reviews = (product.reviews ?? []) as ProductReview[];
  const avgRating = reviews.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : null;
  const Arrow = locale === "fa" || locale === "ar" ? ChevronLeft : ChevronRight;
  const discount = product.compareAtPrice && product.compareAtPrice > product.price ? Math.round((1 - product.price / product.compareAtPrice) * 100) : 0;

  const featureCards = [
    { icon: Weight, label: l(locale,"وزن دستگاه","Device weight","Cihaz ağırlığı","وزن الجهاز"), value: localizedSpecValue(locale, specs["وزن"] ?? specs["Weight"] ?? "—") },
    { icon: Volume2, label: l(locale,"سطح صدا","Noise level","Ses seviyesi","مستوى الصوت"), value: localizedSpecValue(locale, specs["سطح صدا"] ?? specs["Noise level"] ?? "—") },
    { icon: BadgeCheck, label: l(locale,"گارانتی","Warranty","Garanti","الضمان"), value: product.warrantyMonths ? l(locale,`${product.warrantyMonths} ماه`,`${product.warrantyMonths} months`,`${product.warrantyMonths} ay`,`${product.warrantyMonths} شهر`) : l(locale,"تضمین اصالت","Authenticity guarantee","Orijinallik garantisi","ضمان الأصالة") },
    { icon: Droplets, label: l(locale,"رطوبت‌ساز","Humidifier","Nemlendirici","المرطب"), value: localizedSpecValue(locale, specs["رطوبت‌ساز"] ?? specs["Humidifier"] ?? "—") },
  ];

  return (
    <main className="flex-1 bg-[#f7fafd] py-5 sm:py-8 lg:py-10">
      <Container>
        <nav className="mb-6 flex flex-wrap items-center gap-2 text-[11px] font-medium text-[#747780]" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-[#001736]">{l(locale,"خانه","Home","Ana sayfa","الرئيسية")}</Link><Arrow className="h-3.5 w-3.5"/>
          <Link href="/shop" className="hover:text-[#001736]">{l(locale,"فروشگاه","Shop","Mağaza","المتجر")}</Link>{categoryName ? <><Arrow className="h-3.5 w-3.5"/><Link href={`/shop/${product.category?.slug}`} className="hover:text-[#001736]">{categoryName}</Link></> : null}<Arrow className="h-3.5 w-3.5"/><strong className="max-w-[22rem] truncate text-[#181c1e]">{name}</strong>
        </nav>

        <section className="grid gap-8 lg:grid-cols-[1.04fr_.96fr] lg:items-start lg:gap-12">
          <ProductGallery images={product.images ?? []} locale={locale} fallbackAlt={name} />

          <div className="lg:pt-1">
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                {product.brand ? <span className="rounded-full border border-[#dfe3e8] bg-white px-3 py-1.5 text-[11px] font-black text-[#43474f]">{product.brand}</span> : null}
                {product.stock > 0 ? <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e2f7eb] px-3 py-1.5 text-[11px] font-black text-[#187143]"><CheckCircle2 className="h-3.5 w-3.5"/>{t("inStock")}</span> : <span className="rounded-full bg-[#ffdada] px-3 py-1.5 text-[11px] font-black text-[#920028]">{t("outOfStock")}</span>}
              </div>
              <button type="button" aria-label="Favorite" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#dfe3e8] bg-white text-[#747780] shadow-sm transition hover:border-[#ba0036] hover:text-[#ba0036]"><Heart className="h-5 w-5"/></button>
            </div>

            <h1 className="mt-5 text-3xl font-black leading-[1.35] text-[#001736] sm:text-4xl lg:text-[2.6rem]">{name}</h1>
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[#747780]">
              <span className="inline-flex items-center gap-1.5"><Star className="h-4.5 w-4.5 fill-[#f4b942] text-[#f4b942]"/><strong className="text-[#181c1e]">{avgRating ? avgRating.toFixed(1) : "—"}</strong><span>({reviews.length})</span></span>
              {product.modelNumber ? <span>{l(locale,"مدل","Model","Model","الموديل")}: <strong className="text-[#181c1e]">{product.modelNumber}</strong></span> : null}
              <span>SKU: <strong className="text-[#181c1e]">{product.sku}</strong></span>
            </div>
            {description ? <p className="mt-6 whitespace-pre-line text-sm leading-8 text-[#43474f]">{description}</p> : null}

            <div className="mt-7 rounded-[1.6rem] border border-[#e0e3e6] bg-white p-6 shadow-[0_20px_54px_rgba(0,23,54,.075)] sm:p-7">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="tabular-nums">{product.compareAtPrice ? <div className="mb-1 text-sm font-medium text-[#9aa0aa] line-through">{formatPrice(product.compareAtPrice,locale)} {c("currency")}</div> : null}<div className="flex items-baseline gap-2"><strong className="text-3xl font-black text-[#001736] sm:text-4xl">{formatPrice(product.price,locale)}</strong><span className="text-xs font-bold text-[#747780]">{c("currency")}</span></div></div>
                {discount > 0 ? <span className="rounded-xl bg-[#ba0036] px-3 py-2 text-xs font-black text-white">{discount}% {l(locale,"تخفیف","OFF","İNDİRİM","خصم")}</span> : null}
              </div>
              <div className="mt-6"><AddToCartButton type="product" id={product.id} nameFa={product.nameFa} nameTr={product.nameTr} nameEn={product.nameEn} nameAr={product.nameAr} price={product.price} image={image?.url} disabled={product.stock <= 0} maxQuantity={product.maxOrderQty ?? product.stock}/></div>
              <button type="button" className="vitalis-focus mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border-2 border-[#001736] bg-white px-5 text-sm font-black text-[#001736] transition hover:bg-[#f1f4f7]"><GitCompareArrows className="h-4.5 w-4.5"/>{l(locale,"افزودن به مقایسه","Add to compare","Karşılaştırmaya ekle","أضف للمقارنة")}</button>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">{featureCards.map(({icon:Icon,label,value})=><div key={label} className="rounded-2xl border border-[#e0e3e6] bg-white p-4 shadow-[0_8px_24px_rgba(0,23,54,.04)]"><Icon className="h-5 w-5 text-[#009dd8]"/><p className="mt-3 text-[10px] font-bold text-[#747780]">{label}</p><strong className="mt-1 block break-words text-xs leading-6 text-[#001736]">{value || "—"}</strong></div>)}</div>
          </div>
        </section>

        <section className="mt-8 grid gap-3 sm:grid-cols-3">
          {[[Truck,l(locale,"ارسال سریع و ایمن","Fast & secure delivery","Hızlı ve güvenli teslimat","توصيل سريع وآمن")],[ShieldCheck,l(locale,"تضمین اصالت کالا","Authenticity guaranteed","Orijinallik garantisi","ضمان الأصالة")],[Headphones,l(locale,"پشتیبانی تخصصی","Specialist support","Uzman destek","دعم متخصص")]].map(([Icon,label])=>{const I=Icon as typeof Truck;return <div key={String(label)} className="flex items-center gap-3 rounded-2xl border border-[#e0e3e6] bg-white p-5"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e7f5fb] text-[#002b5b]"><I className="h-5 w-5"/></span><p className="text-sm font-black text-[#001736]">{label as string}</p></div>;})}
        </section>

        {specEntries.length ? <section className="mt-12 sm:mt-16"><h2 className="mb-5 text-2xl font-black text-[#001736]">{t("specsTitle")}</h2><dl className="overflow-hidden rounded-3xl border border-[#e0e3e6] bg-white shadow-[0_14px_40px_rgba(0,23,54,.045)]">{specEntries.map(([key,value],index)=><div key={key} className={cnRow(index)}><dt className="font-semibold text-[#747780]">{key}</dt><dd className="font-bold text-[#181c1e]">{localizedSpecValue(locale,value)}</dd></div>)}</dl></section> : null}

        {reviews.length ? <section className="mt-12 sm:mt-16"><div className="flex items-center justify-between gap-4"><h2 className="text-2xl font-black text-[#001736]">{l(locale,"نظر خریداران","Customer reviews","Müşteri yorumları","آراء العملاء")}</h2><span className="text-xs font-bold text-[#747780]">{reviews.length}</span></div><div className="mt-5 grid gap-4 md:grid-cols-2">{reviews.slice(0,6).map((review)=><article key={review.id} className="rounded-2xl border border-[#e0e3e6] bg-white p-5 shadow-sm"><div className="flex items-center justify-between gap-3"><strong className="text-sm text-[#001736]">{review.authorName}</strong><span className="flex items-center gap-1 text-xs font-black text-[#8a6400]"><Star className="h-4 w-4 fill-[#f4b942] text-[#f4b942]"/>{review.rating}/5</span></div>{review.title ? <h3 className="mt-3 text-sm font-bold">{review.title}</h3> : null}{review.body ? <p className="mt-2 text-sm leading-7 text-[#43474f]">{review.body}</p> : null}</article>)}</div></section> : null}

        {related.length ? <section className="mt-12 sm:mt-16"><div className="mb-6 flex items-center justify-between gap-4"><h2 className="text-2xl font-black text-[#001736]">{t("relatedTitle")}</h2><Link href={`/shop/${product.category?.slug ?? ""}`} className="inline-flex items-center gap-1 text-xs font-black text-[#ba0036]">{l(locale,"مشاهده همه","View all","Tümünü gör","عرض الكل")}<Arrow className="h-4 w-4"/></Link></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{related.map((p)=><ShopProductCard key={p.id} product={p}/>)}</div></section> : null}
      </Container>
    </main>
  );
}

function cnRow(index: number) { return `grid gap-2 px-5 py-4 text-sm sm:grid-cols-[minmax(180px,.35fr)_1fr] sm:px-6 ${index % 2 ? "bg-[#f7fafd]" : "bg-white"}`; }
