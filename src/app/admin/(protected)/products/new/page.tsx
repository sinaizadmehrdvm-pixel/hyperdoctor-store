import { ProductForm } from "@/components/admin/product-form";

export default function NewProductPage() {
  return (
    <div>
      <h1 className="text-xl font-bold text-foreground mb-6">محصول جدید</h1>
      <ProductForm />
    </div>
  );
}
