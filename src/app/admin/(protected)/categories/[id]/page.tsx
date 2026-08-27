import { notFound } from "next/navigation";
import { CategoryForm } from "@/components/admin/category-form";
import { adminRpc } from "@/lib/admin-data";

type CategoryDetail = {
  id: string;
  vertical: string;
  slug: string;
  nameFa: string;
  nameTr: string;
  nameEn: string;
  nameAr: string;
  descriptionFa: string;
  descriptionTr: string;
  descriptionEn: string;
  descriptionAr: string;
  image?: string | null;
  order: number;
  isPublished: boolean;
};

export default async function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const category = await adminRpc<CategoryDetail | null>("admin_category_detail", { p_id: id });
  if (!category) notFound();

  return (
    <div>
      <h1 className="mb-6 text-xl font-black text-foreground">ویرایش دسته‌بندی</h1>
      <CategoryForm category={category} />
    </div>
  );
}
