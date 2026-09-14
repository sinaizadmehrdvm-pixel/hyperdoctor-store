import "server-only";
import { supabaseRpc } from "@/lib/supabase-rest";

type CatalogReadResult =
  | { status: "ok"; rows: any[] }
  | { status: "unavailable"; rows: [] };

const CATALOG_MAX_ATTEMPTS = 3;

function isRetriableCatalogError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return (
    /Supabase RPC (408|425|429|5\d\d)\b/i.test(message) ||
    /fetch failed|network|socket|ECONNRESET|ECONNREFUSED|ETIMEDOUT|EAI_AGAIN|ENOTFOUND|TLS|SSL|terminated|upstream/i.test(message)
  );
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function readCatalog(slug?: string): Promise<CatalogReadResult> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= CATALOG_MAX_ATTEMPTS; attempt += 1) {
    try {
      const data = await supabaseRpc<unknown>("public_catalog_v286", { p_slug: slug ?? null });
      return { status: "ok", rows: Array.isArray(data) ? data : [] };
    } catch (error) {
      lastError = error;
      const retriable = isRetriableCatalogError(error);
      if (!retriable || attempt === CATALOG_MAX_ATTEMPTS) break;
      await delay(125 * attempt);
    }
  }

  console.error("[catalog-v286] verified catalog unavailable", {
    slug: slug ?? null,
    error: lastError instanceof Error ? lastError.message : String(lastError ?? "unknown error"),
  });
  return { status: "unavailable", rows: [] };
}

export async function getCatalogV286(opts: { categorySlug?: string; q?: string; brand?: string; sort?: string } = {}) {
  const result = await readCatalog();
  if (result.status === "unavailable") {
    return {
      status: "unavailable" as const,
      products: [] as any[],
      categories: [] as any[],
      brands: [] as any[],
      total: 0,
      activeCategory: null,
    };
  }

  const all = result.rows;
  const categories = [...new Map(all.filter((p: any) => p.category?.id).map((p: any) => [p.category.id, p.category])).values()];
  const active = opts.categorySlug ? categories.find((c: any) => c.slug === opts.categorySlug) : null;
  let products = all;
  if (opts.categorySlug) products = active ? products.filter((p: any) => p.categoryId === active.id) : [];
  if (opts.brand) products = products.filter((p: any) => p.brandId === opts.brand);
  const q = opts.q?.trim().replace(/\s+/g, " ").slice(0, 120).toLocaleLowerCase();
  if (q) products = products.filter((p: any) => [p.nameFa, p.nameTr, p.nameEn, p.nameAr, p.modelNumber, p.sku, p.brand, p.brandEntity?.name].some((v) => String(v ?? "").toLocaleLowerCase().includes(q)));
  products.sort(opts.sort === "name" ? (a: any, b: any) => String(a.nameEn ?? a.nameFa).localeCompare(String(b.nameEn ?? b.nameFa)) : (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const catCount = new Map<string, number>();
  const brandCount = new Map<string, number>();
  for (const p of all) {
    if (p.categoryId) catCount.set(p.categoryId, (catCount.get(p.categoryId) ?? 0) + 1);
    if (p.brandId) brandCount.set(p.brandId, (brandCount.get(p.brandId) ?? 0) + 1);
  }
  const visibleCategories = categories.map((c: any) => ({ ...c, count: catCount.get(c.id) ?? 0 })).filter((c: any) => c.count > 0).sort((a: any, b: any) => Number(a.order ?? 0) - Number(b.order ?? 0));
  const brands = [...new Map(all.filter((p: any) => p.brandEntity?.id).map((p: any) => [p.brandEntity.id, p.brandEntity])).values()].map((b: any) => ({ ...b, count: brandCount.get(b.id) ?? 0 })).sort((a: any, b: any) => String(a.name).localeCompare(String(b.name)));
  return { status: "ok" as const, products, categories: visibleCategories, brands, total: products.length, activeCategory: active ?? null };
}

export async function getCatalogProductV286(slug: string) {
  const result = await readCatalog(slug);
  if (result.status === "unavailable") return { status: "unavailable" as const, product: null };
  return { status: "ok" as const, product: result.rows[0] ?? null };
}
