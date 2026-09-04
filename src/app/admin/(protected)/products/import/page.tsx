import { ProductImportPanel } from "@/components/admin/product-import-panel";
import { currentAdminLocale } from "@/lib/admin-locale-server";
import type { AdminLocale } from "@/lib/admin-i18n";

const copy: Record<AdminLocale, { title: string; subtitle: string }> = {
  fa: { title: "ورود گروهی کالاها", subtitle: "ورود یا به‌روزرسانی امن محصولات با فایل CSV و پشتیبانی کامل از چهار زبان." },
  ar: { title: "استيراد المنتجات دفعة واحدة", subtitle: "استيراد أو تحديث المنتجات بأمان عبر CSV مع دعم كامل للغات الأربع." },
  en: { title: "Bulk product import", subtitle: "Safely create or update products from CSV with full four-language support." },
  tr: { title: "Toplu ürün içe aktarma", subtitle: "CSV ile ürünleri güvenli biçimde oluşturun veya güncelleyin; dört dil tam desteklenir." },
};

export default async function ProductImportPage() {
  const locale = await currentAdminLocale();
  const t = copy[locale];
  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6">
        <h1 className="text-xl font-black text-foreground sm:text-2xl">{t.title}</h1>
        <p className="mt-2 text-sm text-muted">{t.subtitle}</p>
      </div>
      <ProductImportPanel locale={locale} />
    </div>
  );
}
