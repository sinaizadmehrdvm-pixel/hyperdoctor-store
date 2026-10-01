import { prisma } from "@/lib/prisma";
import { CategoryForm } from "@/components/admin/category-form";

export const dynamic = "force-dynamic";

export default async function NewCategoryPage() {
  const parentCategories = await prisma.category.findMany({ orderBy: { order: "asc" }, select: { id: true, nameFa: true } });
  return (
    <div>
      <h1 className="text-xl font-bold text-foreground mb-6">دسته‌بندی جدید</h1>
      <CategoryForm parentCategories={parentCategories} />
    </div>
  );
}
