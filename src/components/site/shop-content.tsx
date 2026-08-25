import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/container";
import { ProductCard } from "@/components/site/product-card";
import { SortSelect } from "@/components/site/shop-filters";
import { getCategories, getProducts, type ProductSort } from "@/lib/queries";
import { cn } from "@/lib/utils";
import { localizedName } from "@/lib/i18n-content";
import { Search, SlidersHorizontal } from "lucide-react";

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
    <main className="flex-1 py-8 sm:py-12">
      <Container>
        <section className="vitalis-dark-panel relative overflow-hidden rounded-3xl px-5 py-8 sm:px-8 sm:py-10">
          <div className="relative z-10 max-w-2xl">
            <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-navy-muted">
              <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
              Hyper Doctor Store
            </div>
            <h1 className="text-2xl font-black text-white sm:text-4xl">{t("title")}</h1>
            <p className="mt-3 max-w-xl text-sm leading-7 text-navy-muted sm:text-base">
              {locale === "fa"
                ? "تجهیزات پزشکی، تنفسی و مراقبت در منزل را بر اساس دسته‌بندی، مدل و برند پیدا کنید."
                : locale === "tr"
                  ? "Medikal, solunum ve evde bakım ürünlerini kategori, model ve markaya göre bulun."
                  : locale === "ar"
                    ? "اعثر على معدات طبية وتنفسية ورعاية منزلية حسب الفئة والطراز والعلامة التجارية."
                    : "Find medical, respiratory and home-care equipment by category, model and brand."}
            </p>
          </div>
        </section>

        <div className="mt-6 vitalis-glass rounded-2xl p-3 sm:p-4">
          <form action={`/${locale}/shop`} method="get" className="flex flex-col gap-3 sm:flex-row">
            <label className="relative flex-1">
              <span className="sr-only">{t("title")}</span>
              <Search className="pointer-events-none absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
              <input
                name="q"
                defaultValue={search ?? ""}
                placeholder={locale === "fa" ? "جستجوی نام، برند، مدل یا SKU..." : locale === "tr" ? "Ürün, marka, model veya SKU ara..." : locale === "ar" ? "ابحث بالاسم أو العلامة أو الموديل أو SKU..." : "Search name, brand, model or SKU..."}
                className="vitalis-focus h-12 w-full rounded-xl border border-border bg-white ps-11 pe-4 text-sm text-foreground placeholder:text-muted"
              />
            </label>
            <button className="h-12 rounded-xl bg-primary px-6 text-sm font-bold text-white shadow-sm transition hover:bg-primary-container vitalis-focus">
              {locale === "fa" ? "جستجو" : locale === "tr" ? "Ara" : locale === "ar" ? "بحث" : "Search"}
            </button>
          </form>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[260px_1fr]">
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="vitalis-panel p-4 sm:p-5">
              <h2 className="mb-3 text-sm font-bold text-foreground">{t("filterCategory")}</h2>
              <nav className="flex flex-row flex-wrap gap-2 lg:flex-col" aria-label={t("filterCategory")}>
                <Link
                  href="/shop"
                  className={cn(
                    "min-h-11 flex items-center justify-between rounded-xl px-3 text-sm font-semibold transition-colors vitalis-focus",
                    !categorySlug
                      ? "bg-primary text-white"
                      : "text-foreground hover:bg-muted-bg",
                  )}
                >
                  <span>{t("filterAll")}</span>
                </Link>
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/shop/${cat.slug}`}
                    className={cn(
                      "min-h-11 flex items-center justify-between gap-3 rounded-xl px-3 text-sm font-semibold transition-colors vitalis-focus",
                      categorySlug === cat.slug
                        ? "bg-primary text-white"
                        : "text-foreground hover:bg-muted-bg",
                    )}
                  >
                    <span className="line-clamp-1">{localizedName(locale, cat)}</span>
                    <span className={cn("text-xs tabular-nums", categorySlug === cat.slug ? "text-white/75" : "text-muted")}>
                      {cat._count.products}
                    </span>
                  </Link>
                ))}
              </nav>
            </div>
          </aside>

          <section>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted">
                {locale === "fa"
                  ? `${products.length} کالا`
                  : locale === "tr"
                    ? `${products.length} ürün`
                    : locale === "ar"
                      ? `${products.length} منتج`
                      : `${products.length} products`}
              </p>
              <SortSelect />
            </div>

            {products.length === 0 ? (
              <div className="vitalis-panel flex min-h-52 items-center justify-center p-10 text-center text-sm text-muted">
                {t("empty")}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 xl:grid-cols-4">
                {products.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}
          </section>
        </div>
      </Container>
    </main>
  );
}
