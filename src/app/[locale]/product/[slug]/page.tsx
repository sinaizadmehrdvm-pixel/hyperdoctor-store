import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { ProductCard } from "@/components/site/product-card";
import { ProductGallery } from "@/components/site/product-gallery";
import { AddToCartButton } from "@/components/site/add-to-cart-button";
import { formatPrice } from "@/lib/utils";
import { localizedDescription, localizedName, pickLocalized } from "@/lib/i18n-content";
import { getProductBySlug, getRelatedProducts } from "@/lib/queries";
import {
  BadgeCheck,
  Box,
  CheckCircle2,
  Heart,
  PackageCheck,
  ShieldCheck,
  Star,
  Tag,
  Truck,
} from "lucide-react";

type LocalizedSpec = string | { fa?: string; tr?: string; en?: string; ar?: string };
type Specs = Record<string, LocalizedSpec>;
type ProductReview = {
  id: string;
  authorName: string;
  rating: number;
  title?: string | null;
  body?: string | null;
};

function localizedSpecValue(locale: string, value: LocalizedSpec) {
  if (typeof value === "string") return value;
  return pickLocalized(locale, value);
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [locale, t, c] = await Promise.all([
    getLocale(),
    getTranslations("shop"),
    getTranslations("common"),
  ]);

  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const related = await getRelatedProducts(product.categoryId, product.id);
  let specs: Specs = {};
  try {
    specs = JSON.parse(product.specs) as Specs;
  } catch {
    specs = {};
  }

  const specEntries = Object.entries(specs);
  const name = localizedName(locale, product);
  const description = localizedDescription(locale, product);
  const categoryName = localizedName(locale, product.category);
  const image = product.images[0];
  const reviews = product.reviews as ProductReview[];
  const avgRating = reviews.length
    ? reviews.reduce((sum: number, review: ProductReview) => sum + review.rating, 0) / reviews.length
    : null;

  const metaCards = [
    {
      icon: Box,
      label: locale === "fa" ? "وضعیت موجودی" : locale === "tr" ? "Stok durumu" : locale === "ar" ? "حالة المخزون" : "Stock status",
      value: product.stock > 0 ? t("inStock") : t("outOfStock"),
    },
    {
      icon: BadgeCheck,
      label: locale === "fa" ? "گارانتی" : locale === "tr" ? "Garanti" : locale === "ar" ? "الضمان" : "Warranty",
      value: product.warrantyMonths
        ? locale === "fa"
          ? `${product.warrantyMonths} ماه`
          : locale === "tr"
            ? `${product.warrantyMonths} ay`
            : locale === "ar"
              ? `${product.warrantyMonths} شهر`
              : `${product.warrantyMonths} months`
        : locale === "fa" ? "تضمین اصالت" : locale === "tr" ? "Orijinallik garantisi" : locale === "ar" ? "ضمان الأصالة" : "Authenticity guarantee",
    },
    {
      icon: Tag,
      label: locale === "fa" ? "مدل" : locale === "tr" ? "Model" : locale === "ar" ? "الموديل" : "Model",
      value: product.modelNumber || "—",
    },
    {
      icon: PackageCheck,
      label: "SKU",
      value: product.sku,
    },
  ];

  return (
    <main className="flex-1 bg-[#fbf9fc] py-6 sm:py-10">
      <Container>
        <nav className="mb-6 flex flex-wrap items-center gap-2 text-xs text-[#74777f]" aria-label="Breadcrumb">
          <span>{locale === "fa" ? "خانه" : "Home"}</span><span>›</span>
          <span>{locale === "fa" ? "فروشگاه" : "Shop"}</span><span>›</span>
          <span>{categoryName}</span><span>›</span>
          <strong className="max-w-[20rem] truncate text-[#1b1b1e]">{name}</strong>
        </nav>

        <div className="grid gap-8 lg:grid-cols-2 lg:items-start lg:gap-12">
          <ProductGallery images={product.images} locale={locale} fallbackAlt={name} />

          <section className="lg:pt-2">
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                {product.brand ? <Badge variant="muted">{product.brand}</Badge> : null}
                {product.isNewArrival ? <Badge variant="primary">NEW</Badge> : null}
                {product.stock > 0 ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                    <CheckCircle2 className="h-3.5 w-3.5" />{t("inStock")}
                  </span>
                ) : <Badge variant="accent">{t("outOfStock")}</Badge>}
              </div>
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#e3e2e5] bg-white text-[#44474e] shadow-sm" aria-hidden="true">
                <Heart className="h-5 w-5" />
              </span>
            </div>

            <h1 className="mt-5 text-3xl font-black leading-[1.35] text-black sm:text-4xl">{name}</h1>

            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-[#74777f]">
              {avgRating ? (
                <span className="inline-flex items-center gap-1.5">
                  <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                  <strong className="text-[#1b1b1e]">{avgRating.toFixed(1)}</strong>
                  <span>({reviews.length})</span>
                </span>
              ) : null}
              {product.modelNumber ? <span>{locale === "fa" ? "مدل" : "Model"}: <strong className="text-[#1b1b1e]">{product.modelNumber}</strong></span> : null}
              <span>SKU: <strong className="text-[#1b1b1e]">{product.sku}</strong></span>
            </div>

            {description ? <p className="mt-6 whitespace-pre-line text-sm leading-8 text-[#44474e] sm:text-base">{description}</p> : null}

            <div className="mt-7 rounded-[1.7rem] border border-white/70 bg-white/90 p-6 shadow-[0_22px_60px_rgba(4,27,58,.08)] backdrop-blur sm:p-7">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="tabular-nums">
                  {product.compareAtPrice ? <div className="mb-2 text-sm text-[#74777f] line-through">{formatPrice(product.compareAtPrice, locale)} {c("currency")}</div> : null}
                  <div className="flex items-baseline gap-2">
                    <strong className="text-3xl font-black text-black sm:text-4xl">{formatPrice(product.price, locale)}</strong>
                    <span className="text-sm font-semibold text-[#44474e]">{c("currency")}</span>
                  </div>
                </div>
                {product.compareAtPrice && product.compareAtPrice > product.price ? (
                  <span className="rounded-lg bg-[#ffdada] px-3 py-2 text-xs font-black text-[#920028]">
                    {locale === "fa" ? "تخفیف ویژه" : locale === "tr" ? "Özel indirim" : locale === "ar" ? "خصم خاص" : "Special offer"}
                  </span>
                ) : null}
              </div>

              <div className="mt-6">
                <AddToCartButton
                  type="product"
                  id={product.id}
                  nameFa={product.nameFa}
                  nameTr={product.nameTr}
                  nameEn={product.nameEn}
                  nameAr={product.nameAr}
                  price={product.price}
                  image={image?.url}
                  disabled={product.stock <= 0}
                  maxQuantity={product.maxOrderQty ?? product.stock}
                />
              </div>
            </div>
          </section>
        </div>

        <section className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {metaCards.map(({ icon: Icon, label, value }) => (
            <div key={label} className="rounded-2xl border border-[#e3e2e5] bg-white p-5 text-center shadow-[0_12px_35px_rgba(4,27,58,.04)]">
              <Icon className="mx-auto h-7 w-7 text-black" />
              <p className="mt-3 text-xs text-[#74777f]">{label}</p>
              <strong className="mt-2 block break-words text-sm leading-6 text-[#1b1b1e]">{value}</strong>
            </div>
          ))}
        </section>

        <section className="mt-8 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-[#e3e2e5] bg-white p-5"><Truck className="h-5 w-5 text-[#009dd8]" /><p className="mt-2 text-sm font-bold">{locale === "fa" ? "ارسال سریع و ایمن" : "Fast & secure delivery"}</p></div>
          <div className="rounded-2xl border border-[#e3e2e5] bg-white p-5"><ShieldCheck className="h-5 w-5 text-[#009dd8]" /><p className="mt-2 text-sm font-bold">{locale === "fa" ? "تضمین اصالت کالا" : "Authenticity guaranteed"}</p></div>
          <div className="rounded-2xl border border-[#e3e2e5] bg-white p-5"><PackageCheck className="h-5 w-5 text-[#009dd8]" /><p className="mt-2 text-sm font-bold">{locale === "fa" ? "پشتیبانی تخصصی" : "Specialist support"}</p></div>
        </section>

        {specEntries.length > 0 ? (
          <section className="mt-12 sm:mt-16">
            <h2 className="mb-5 text-2xl font-black text-black">{t("specsTitle")}</h2>
            <dl className="overflow-hidden rounded-3xl border border-[#e3e2e5] bg-white shadow-[0_16px_44px_rgba(4,27,58,.04)]">
              {specEntries.map(([key, value], index) => (
                <div key={key} className={`grid gap-2 px-5 py-4 text-sm sm:grid-cols-[minmax(180px,.35fr)_1fr] sm:px-6 ${index % 2 ? "bg-[#f5f3f6]" : "bg-white"}`}>
                  <dt className="font-semibold text-[#74777f]">{key}</dt>
                  <dd className="font-bold text-[#1b1b1e]">{localizedSpecValue(locale, value)}</dd>
                </div>
              ))}
            </dl>
          </section>
        ) : null}

        {reviews.length > 0 ? (
          <section className="mt-12 sm:mt-16">
            <h2 className="text-2xl font-black text-black">{locale === "fa" ? "نظر خریداران" : locale === "tr" ? "Müşteri yorumları" : locale === "ar" ? "آراء العملاء" : "Customer reviews"}</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {reviews.slice(0, 6).map((review: ProductReview) => (
                <article key={review.id} className="rounded-2xl border border-[#e3e2e5] bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-3"><strong className="text-sm">{review.authorName}</strong><span className="flex items-center gap-1 text-xs font-bold text-amber-600"><Star className="h-4 w-4 fill-amber-400 text-amber-400" />{review.rating}/5</span></div>
                  {review.title ? <h3 className="mt-3 text-sm font-bold">{review.title}</h3> : null}
                  {review.body ? <p className="mt-2 text-sm leading-6 text-[#44474e]">{review.body}</p> : null}
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {related.length > 0 ? (
          <section className="mt-12 sm:mt-16">
            <h2 className="mb-6 text-2xl font-black text-black">{t("relatedTitle")}</h2>
            <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-4">{related.map((p) => <ProductCard key={p.id} product={p} />)}</div>
          </section>
        ) : null}
      </Container>
    </main>
  );
}
