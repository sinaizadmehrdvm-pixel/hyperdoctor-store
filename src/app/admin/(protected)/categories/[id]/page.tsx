import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CategoryForm } from "@/components/admin/category-form";

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [category, parentCategories] = await Promise.all([
    prisma.category.findUnique({ where: { id } }),
    prisma.category.findMany({ where: { id: { not: id } }, orderBy: { order: "asc" }, select: { id: true, nameFa: true } }),
  ]);
  if (!category) notFound();

  return (
    <div>
      <h1 className="text-xl font-bold text-foreground mb-6">ویرایش دسته‌بندی</h1>
      <CategoryForm category={category} parentCategories={parentCategories} />
    </div>
  );
}
