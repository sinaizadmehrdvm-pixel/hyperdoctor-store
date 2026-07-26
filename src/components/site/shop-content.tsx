import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/container";
import { ProductCard } from "@/components/site/product-card";
import { SortSelect } from "@/components/site/shop-filters";
import { getCategories, getProducts, type ProductSort } from "@/lib/queries";
import { cn } from "@/lib/utils";

export async function ShopContent({
  categorySlug,
  sort,
  search,
}: {
  categorySlug?: string;
  sort?: ProductSort;
  search?: string;
}) {
  const locale = await getLocale();
  const t = await getTranslations("shop");

  const [categories, products] = await Promise.all([
    getCategories(),
    getProducts({ categorySlug, sort, search }),
  ]);

  return (
    <main className="flex-1 py-12">
      <Container>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{t("title")}</h1>

        <div className="mt-8 grid gap-8 lg:grid-cols-[220px_1fr]">
          <aside>
            <h2 className="text-sm font-semibold text-muted mb-3">
              {t("filterCategory")}
            </h2>
            <nav className="flex flex-row flex-wrap gap-2 lg:flex-col">
              <Link
                href="/shop"
                className={cn(
                  "min-h-10 flex items-center rounded-lg px-3 text-sm font-medium",
                  !categorySlug
                    ? "bg-primary/10 text-primary"
                    : "text-foreground hover:bg-muted-bg"
                )}
              >
                {t("filterAll")}
              </Link>
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/shop/${cat.slug}`}
                  className={cn(
                    "min-h-10 flex items-center rounded-lg px-3 text-sm font-medium",
                    categorySlug === cat.slug
                      ? "bg-primary/10 text-primary"
                      : "text-foreground hover:bg-muted-bg"
                  )}
                >
                  {locale === "fa" ? cat.nameFa : cat.nameEn}
                  <span className="ms-2 text-xs text-muted tabular-nums">
                    {cat._count.products}
                  </span>
                </Link>
              ))}
            </nav>
          </aside>

          <div>
            <div className="flex justify-end mb-6">
              <SortSelect />
            </div>
            {products.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-border p-12 text-center text-sm text-muted">
                {t("empty")}
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-5 md:grid-cols-3">
                {products.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}
          </div>
        </div>
      </Container>
    </main>
  );
}
