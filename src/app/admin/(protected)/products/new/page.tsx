import { prisma } from "@/lib/prisma";
import { ProductForm } from "@/components/admin/product-form";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function NewProductPage() {
  const [categories, brands] = await Promise.all([
    prisma.category.findMany({ orderBy: { order: "asc" } }),
    prisma.brand.findMany({ orderBy: [{ order: "asc" }, { nameEn: "asc" }] }),
  ]);
  return (
    <div>
      <h1 className="text-xl font-bold text-foreground mb-6">محصول جدید</h1>
      <ProductForm categories={categories} brands={brands} />
    </div>
  );
}
