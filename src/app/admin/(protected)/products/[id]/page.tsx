import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProductForm } from "@/components/admin/product-form";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id }, include: { images: true } });
  if (!product) notFound();

  return (
    <div>
      <h1 className="text-xl font-bold text-foreground mb-6">ویرایش محصول</h1>
      <ProductForm product={product} />
    </div>
  );
}
