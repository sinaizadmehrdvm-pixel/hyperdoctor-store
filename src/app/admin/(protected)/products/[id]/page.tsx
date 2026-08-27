import { notFound } from "next/navigation";
import { adminRpc } from "@/lib/admin-data";
import { ProductForm } from "@/components/admin/product-form";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await adminRpc<any | null>("admin_product_detail", { p_id: id });
  if (!product) notFound();

  return (
    <div className="mx-auto max-w-7xl">
      <p className="text-xs font-black uppercase tracking-[.18em] text-[#009dd8]">CATALOG EDITOR</p>
      <h1 className="mb-6 mt-2 text-3xl font-black text-[#001736]">ویرایش محصول</h1>
      <ProductForm product={product} />
    </div>
  );
}
