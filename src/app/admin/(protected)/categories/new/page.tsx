import { CategoryForm } from "@/components/admin/category-form";

export default function NewCategoryPage() {
  return (
    <div>
      <h1 className="text-xl font-bold text-foreground mb-6">دسته‌بندی جدید</h1>
      <CategoryForm />
    </div>
  );
}
