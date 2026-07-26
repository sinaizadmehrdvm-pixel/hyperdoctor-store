import { ShopContent } from "@/components/site/shop-content";
import type { ProductSort } from "@/lib/queries";

export default async function ShopCategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ categorySlug: string }>;
  searchParams: Promise<{ sort?: string; q?: string }>;
}) {
  const { categorySlug } = await params;
  const { sort, q } = await searchParams;
  return <ShopContent categorySlug={categorySlug} sort={sort as ProductSort} search={q} />;
}
