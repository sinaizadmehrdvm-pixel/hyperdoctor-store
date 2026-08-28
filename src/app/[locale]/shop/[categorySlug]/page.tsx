import { notFound } from "next/navigation";
import { ShopContent } from "@/components/site/shop-content";
import { getCategoryBySlug, type ProductSort } from "@/lib/queries";

const SORT_VALUES = new Set<ProductSort>(["newest", "price-asc", "price-desc"]);
const MAX_SEARCH_LENGTH = 120;
const SAFE_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function normalizeSort(value?: string): ProductSort {
  return value && SORT_VALUES.has(value as ProductSort) ? (value as ProductSort) : "newest";
}

function normalizeSearch(value?: string) {
  const normalized = value?.trim().replace(/\s+/g, " ");
  return normalized ? normalized.slice(0, MAX_SEARCH_LENGTH) : undefined;
}

export default async function ShopCategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ categorySlug: string }>;
  searchParams: Promise<{ sort?: string; q?: string }>;
}) {
  const { categorySlug } = await params;
  const { sort, q } = await searchParams;

  if (!SAFE_SLUG.test(categorySlug)) notFound();
  const category = await getCategoryBySlug(categorySlug);
  if (!category) notFound();

  return (
    <ShopContent
      categorySlug={categorySlug}
      sort={normalizeSort(sort)}
      search={normalizeSearch(q)}
    />
  );
}
