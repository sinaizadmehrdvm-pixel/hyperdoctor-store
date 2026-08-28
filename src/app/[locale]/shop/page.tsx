import { ShopContent } from "@/components/site/shop-content";
import type { ProductSort } from "@/lib/queries";

const SORT_VALUES = new Set<ProductSort>(["newest", "price-asc", "price-desc"]);
const MAX_SEARCH_LENGTH = 120;

function normalizeSort(value?: string): ProductSort {
  return value && SORT_VALUES.has(value as ProductSort) ? (value as ProductSort) : "newest";
}

function normalizeSearch(value?: string) {
  const normalized = value?.trim().replace(/\s+/g, " ");
  return normalized ? normalized.slice(0, MAX_SEARCH_LENGTH) : undefined;
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; q?: string }>;
}) {
  const { sort, q } = await searchParams;
  return <ShopContent sort={normalizeSort(sort)} search={normalizeSearch(q)} />;
}
