import { ShopContent } from "@/components/site/shop-content";
import type { ProductSort } from "@/lib/queries";

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; q?: string }>;
}) {
  const { sort, q } = await searchParams;
  return <ShopContent sort={sort as ProductSort} search={q} />;
}
