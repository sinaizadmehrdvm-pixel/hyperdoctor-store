import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { ProductCard } from "@/components/site/product-card";
import { ProductGallery } from "@/components/site/product-gallery";
import { AddToCartButton } from "@/components/site/add-to-cart-button";
import { formatPrice } from "@/lib/utils";
import { getProductBySlug, getRelatedProducts } from "@/lib/queries";

type Specs = Record<string, { fa: string; en: string }>;

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [localeValue, t, c] = await Promise.all([
    getLocale(),
    getTranslations("shop"),
    getTranslations("common"),
  ]);
  const locale = localeValue === "en" ? "en" : "fa";

  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const related = await getRelatedProducts(product.categoryId, product.id);
  let specs: Specs = {};
  try {
    specs = JSON.parse(product.specs);
  } catch {
    specs = {};
  }
  const specEntries = Object.entries(specs);
  const name = locale === "fa" ? product.nameFa : product.nameEn;
  const description = locale === "fa" ? product.descriptionFa : product.descriptionEn;
  const image = product.images[0];

  return (
    <main className="flex-1 py-12">
      <Container>
        <div className="grid gap-10 lg:grid-cols-2">
          <ProductGallery images={product.images} locale={locale} />

          <div>
            {product.brand ? <Badge variant="muted">{product.brand}</Badge> : null}
            <h1 className="mt-3 text-2xl sm:text-3xl font-bold text-foreground">
              {name}
            </h1>
            <div className="mt-4 flex items-baseline gap-2 tabular-nums">
              <span className="text-3xl font-bold text-foreground">
                {formatPrice(product.price, locale)}
              </span>
              <span className="text-sm text-muted">{c("currency")}</span>
              {product.compareAtPrice ? (
                <span className="text-sm text-muted line-through">
                  {formatPrice(product.compareAtPrice, locale)}
                </span>
              ) : null}
            </div>

            <p className="mt-2 text-sm font-medium text-foreground">
              {product.stock > 0 ? t("inStock") : t("outOfStock")}
            </p>

            {description ? (
              <p className="mt-6 leading-7 text-muted whitespace-pre-line">
                {description}
              </p>
            ) : null}

            <div className="mt-8">
              <AddToCartButton
                type="product"
                id={product.id}
                nameFa={product.nameFa}
                nameEn={product.nameEn}
                price={product.price}
                image={image?.url}
                disabled={product.stock <= 0}
              />
            </div>

            {specEntries.length > 0 ? (
              <div className="mt-10">
                <h2 className="text-sm font-semibold text-foreground mb-3">
                  {t("specsTitle")}
                </h2>
                <dl className="divide-y divide-border rounded-xl border border-border overflow-hidden">
                  {specEntries.map(([key, value]) => (
                    <div key={key} className="flex justify-between gap-4 px-4 py-3 text-sm odd:bg-muted-bg">
                      <dt className="text-muted">{key}</dt>
                      <dd className="font-medium text-foreground text-end">
                        {locale === "fa" ? value.fa : value.en}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            ) : null}
          </div>
        </div>

        {related.length > 0 ? (
          <div className="mt-16">
            <h2 className="text-xl font-bold text-foreground mb-6">
              {t("relatedTitle")}
            </h2>
            <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        ) : null}
      </Container>
    </main>
  );
}
