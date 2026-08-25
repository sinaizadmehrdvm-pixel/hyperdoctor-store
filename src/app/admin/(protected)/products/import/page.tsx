import { ProductImportPanel } from "@/components/admin/product-import-panel";

export default function ProductImportPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6">
        <h1 className="text-xl font-black text-foreground sm:text-2xl">ورود گروهی کالاها</h1>
        <p className="mt-2 text-sm text-muted">سریع‌ترین مسیر برای آماده‌کردن فروشگاه با تعداد زیاد محصول.</p>
      </div>
      <ProductImportPanel />
    </div>
  );
}
