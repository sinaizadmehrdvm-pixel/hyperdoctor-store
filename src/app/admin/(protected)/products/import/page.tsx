import Link from "next/link";
import { Database } from "lucide-react";
import { ProductImportPanel } from "@/components/admin/product-import-panel";
import { currentAdminLocale } from "@/lib/admin-locale-server";
import type { AdminLocale } from "@/lib/admin-i18n";

const copy: Record<AdminLocale, { title: string; subtitle: string; sources:string }> = {
  fa: { title: "ورود گروهی کالاها", subtitle: "ورود امن محصولات با Preview، ثبت منبع داده و جداسازی قیمت/موجودی جاری از سوابق تاریخی.", sources:"منابع کاتالوگ" },
  ar: { title: "استيراد المنتجات دفعة واحدة", subtitle: "استيراد آمن مع المعاينة وتسجيل المصدر وفصل البيانات الحالية عن الأسعار التاريخية.", sources:"مصادر الكتالوج" },
  en: { title: "Bulk product import", subtitle: "Safe import with preview, source provenance, and strict separation of current commerce data from historical observations.", sources:"Catalog sources" },
  tr: { title: "Toplu ürün içe aktarma", subtitle: "Önizleme, kaynak kaydı ve güncel ticari veriyi geçmiş gözlemlerden ayıran güvenli aktarım.", sources:"Katalog kaynakları" },
};

export default async function ProductImportPage() {
  const locale = await currentAdminLocale();
  const t = copy[locale];
  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div><h1 className="text-xl font-black text-foreground sm:text-2xl">{t.title}</h1><p className="mt-2 max-w-3xl text-sm text-muted">{t.subtitle}</p></div>
        <Link href="/admin/products/sources" className="inline-flex min-h-10 items-center gap-2 rounded-xl border bg-white px-4 text-xs font-black"><Database className="h-4 w-4"/>{t.sources}</Link>
      </div>
      <ProductImportPanel locale={locale} />
    </div>
  );
}
