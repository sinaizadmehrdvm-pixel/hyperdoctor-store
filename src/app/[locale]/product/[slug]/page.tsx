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
import { CheckCircle2, PackageCheck, ShieldCheck, Star, Truck } from "lucide-react";

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

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
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

  return (
    <main className="flex-1 py-8 sm:py-12">
      <Container>
        <nav className="mb-6 flex flex-wrap items-center gap-2 text-xs text-muted" aria-label="Breadcrumb">
          <span>Hyper Doctor</span>
          <span>/</span>
          <span>{categoryName}</span>
          <span>/</span>
          <span className="max-w-[18rem] truncate text-foreground">{name}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,.95fr)] lg:gap-12">
          <ProductGallery images={product.images} locale={locale} fallbackAlt={name} />

          <section className="lg:pt-2">
            <div className="flex flex-wrap items-center gap-2">
              {product.brand ? <Badge variant="muted">{product.brand}</Badge> : null}
              {product.isNewArrival ? <Badge variant="primary">NEW</Badge> : null}
              {product.stock > 0 ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                  {t("inStock")}
                </span>
              ) : (
                <Badge variant="accent">{t("outOfStock")}</Badge>
              )}
            </div>

            <h1 className="mt-4 text-2xl font-black leading-tight text-foreground sm:text-4xl">{name}</h1>

            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted">
              {product.modelNumber ? <span>Model: <strong className="text-foreground">{product.modelNumber}</strong></span> : null}
              <span>SKU: <strong className="text-foreground">{product.sku}</strong></span>
              {avgRating ? (
                <span className="inline-flex items-center gap-1">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden="true" />
                  <strong className="text-foreground">{avgRating.toFixed(1)}</strong>
                  <span>({reviews.length})</span>
                </span>
              ) : null}
            </div>

            <div className="mt-6 vitalis-panel p-5 sm:p-6">
              <div className="flex flex-wrap items-baseline gap-2 tabular-nums">
                <span className="text-3xl font-black text-primary sm:text-4xl">
                  {formatPrice(product.price, locale)}
                </span>
                <span className="text-sm font-semibold text-muted">{c("currency")}</span>
                {product.compareAtPrice ? (
                  <span className="text-sm text-muted line-through">
                    {formatPrice(product.compareAtPrice, locale)}
                  </span>
                ) : null}
              </div>

              {description ? (
                <p className="mt-5 whitespace-pre-line text-sm leading-7 text-muted sm:text-base">{description}</p>
              ) : null}

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

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-border bg-white p-4">
                <Truck className="h-5 w-5 text-primary-glow" aria-hidden="true" />
                <p className="mt-2 text-xs font-bold text-foreground">
                  {locale === "fa" ? "ارسال سریع و ایمن" : locale === "tr" ? "Hızlı ve güvenli teslimat" : locale === "ar" ? "شحن سريع وآمن" : "Fast & secure delivery"}
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-white p-4">
                <ShieldCheck className="h-5 w-5 text-primary-glow" aria-hidden="true" />
                <p className="mt-2 text-xs font-bold text-foreground">
                  {product.warrantyMonths
                    ? locale === "fa" ? `${product.warrantyMonths} ماه گارانتی` : locale === "tr" ? `${product.warrantyMonths} ay garanti` : locale === "ar" ? `ضمان ${product.warrantyMonths} شهر` : `${product.warrantyMonths}-month warranty`
                    : locale === "fa" ? "تضمین اصالت کالا" : locale === "tr" ? "Orijinallik garantisi" : locale === "ar" ? "ضمان الأصالة" : "Authenticity guaranteed"}
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-white p-4">
                <PackageCheck className="h-5 w-5 text-primary-glow" aria-hidden="true" />
                <p className="mt-2 text-xs font-bold text-foreground">
                  {locale === "fa" ? "پشتیبانی تخصصی" : locale === "tr" ? "Uzman destek" : locale === "ar" ? "دعم متخصص" : "Specialist support"}
                </p>
              </div>
            </div>
          </section>
        </div>

        {specEntries.length > 0 ? (
          <section className="mt-12 sm:mt-16">
            <div className="mb-5 flex items-end justify-between gap-4">
              <h2 className="text-xl font-black text-foreground sm:text-2xl">{t("specsTitle")}</h2>
            </div>
            <dl className="vitalis-panel overflow-hidden">
              {specEntries.map(([key, value], index) => (
                <div
                  key={key}
                  className={`grid gap-2 px-5 py-4 text-sm sm:grid-cols-[minmax(180px,.35fr)_1fr] sm:px-6 ${index % 2 ? "bg-muted-bg/70" : "bg-white"}`}
                >
                  <dt className="font-semibold text-muted">{key}</dt>
                  <dd className="font-bold text-foreground">{localizedSpecValue(locale, value)}</dd>
                </div>
              ))}
            </dl>
          </section>
        ) : null}

        {reviews.length > 0 ? (
          <section className="mt-12 sm:mt-16">
            <h2 className="text-xl font-black text-foreground sm:text-2xl">
              {locale === "fa" ? "نظر خریداران" : locale === "tr" ? "Müşteri yorumları" : locale === "ar" ? "آراء العملاء" : "Customer reviews"}
            </h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {reviews.slice(0, 6).map((review: ProductReview) => (
                <article key={review.id} className="vitalis-panel p-5">
                  <div className="flex items-center justify-between gap-3">
                    <strong className="text-sm text-foreground">{review.authorName}</strong>
                    <span className="flex items-center gap-1 text-xs font-bold text-amber-600">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden="true" />
                      {review.rating}/5
                    </span>
                  </div>
                  {review.title ? <h3 className="mt-3 text-sm font-bold text-foreground">{review.title}</h3> : null}
                  {review.body ? <p className="mt-2 text-sm leading-6 text-muted">{review.body}</p> : null}
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {related.length > 0 ? (
          <section className="mt-12 sm:mt-16">
            <h2 className="mb-6 text-xl font-black text-foreground sm:text-2xl">{t("relatedTitle")}</h2>
            <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-4">
              {related.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        ) : null}
      </Container>
    </main>
  );
}
