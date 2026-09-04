"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, FileSpreadsheet, Loader2, UploadCloud } from "lucide-react";
import { adminNumber, type AdminLocale } from "@/lib/admin-i18n";

type ImportResult = {
  created: number;
  updated: number;
  failed: number;
  errors?: { line: number; sku: string; error: string }[];
};

type Copy = {
  heading:string; description:string; template:string; choose:string; selected:string; limits:string; select:string; start:string; busy:string;
  completed:string; created:string; updated:string; failed:string; fixRows:string; row:string; tips:string; tipsBody:string; genericError:string;
};

const C: Record<AdminLocale, Copy> = {
  fa:{heading:"ورود گروهی محصولات با CSV",description:"قالب را تکمیل کن و محصولات، قیمت، موجودی، اطلاعات چهارزبانه، مشخصات و تصاویر را یکجا وارد کن. SKU موجود به‌روزرسانی می‌شود و SKU جدید ساخته می‌شود.",template:"دانلود قالب CSV",choose:"یک فایل CSV انتخاب کن",selected:"فایل انتخاب‌شده",limits:"حداکثر 5MB · UTF-8 · حداکثر ۲۰۰۰ محصول",select:"انتخاب فایل",start:"شروع ورود کالاها",busy:"در حال ورود...",completed:"ورود فایل انجام شد",created:"جدید",updated:"به‌روزرسانی",failed:"خطا",fixRows:"ردیف‌های نیازمند اصلاح",row:"ردیف",tips:"نکات مهم قبل از Import",tipsBody:"ابتدا دسته‌بندی‌ها را در پنل بساز. categorySlug باید دقیقاً با Slug دسته‌بندی برابر باشد. چهار نام nameFa، nameTr، nameEn و nameAr الزامی هستند. برای چند تصویر، imageUrls را با ; جدا کن.",genericError:"ورود فایل ناموفق بود."},
  ar:{heading:"استيراد المنتجات عبر CSV",description:"املأ القالب لاستيراد المنتجات والأسعار والمخزون والمحتوى بأربع لغات والمواصفات والصور دفعة واحدة. يتم تحديث SKU الموجود وإنشاء SKU الجديد.",template:"تنزيل قالب CSV",choose:"اختر ملف CSV",selected:"الملف المحدد",limits:"الحد الأقصى 5MB · UTF-8 · حتى 2000 منتج",select:"اختيار ملف",start:"بدء الاستيراد",busy:"جارٍ الاستيراد...",completed:"اكتمل استيراد الملف",created:"جديد",updated:"محدّث",failed:"أخطاء",fixRows:"صفوف تحتاج إلى تصحيح",row:"صف",tips:"ملاحظات مهمة قبل الاستيراد",tipsBody:"أنشئ التصنيفات أولاً. يجب أن يطابق categorySlug قيمة Slug بدقة. الأسماء الأربعة nameFa وnameTr وnameEn وnameAr مطلوبة. افصل روابط الصور المتعددة في imageUrls بعلامة ;.",genericError:"فشل استيراد الملف."},
  en:{heading:"Bulk product import with CSV",description:"Fill the template to import products, pricing, stock, four-language content, specifications and image links at once. Existing SKUs are updated and new SKUs are created.",template:"Download CSV template",choose:"Choose a CSV file",selected:"Selected file",limits:"Maximum 5MB · UTF-8 · up to 2,000 products",select:"Choose file",start:"Start product import",busy:"Importing...",completed:"Import completed",created:"Created",updated:"Updated",failed:"Failed",fixRows:"Rows requiring correction",row:"Row",tips:"Important before importing",tipsBody:"Create the required categories first. categorySlug must exactly match the category Slug. All four names—nameFa, nameTr, nameEn and nameAr—are required. Separate multiple image URLs in imageUrls with ;.",genericError:"Import failed."},
  tr:{heading:"CSV ile toplu ürün içe aktarma",description:"Şablonu doldurarak ürünleri, fiyatları, stoğu, dört dilde içeriği, teknik özellikleri ve görsel bağlantılarını tek seferde aktarın. Mevcut SKU güncellenir, yeni SKU oluşturulur.",template:"CSV şablonunu indir",choose:"Bir CSV dosyası seçin",selected:"Seçilen dosya",limits:"En fazla 5MB · UTF-8 · 2.000 ürüne kadar",select:"Dosya seç",start:"Ürün aktarımını başlat",busy:"İçe aktarılıyor...",completed:"İçe aktarma tamamlandı",created:"Yeni",updated:"Güncellendi",failed:"Hata",fixRows:"Düzeltilmesi gereken satırlar",row:"Satır",tips:"İçe aktarmadan önce önemli notlar",tipsBody:"Önce gerekli kategorileri oluşturun. categorySlug kategori Slug değeriyle tam eşleşmelidir. nameFa, nameTr, nameEn ve nameAr alanlarının dördü de zorunludur. imageUrls içindeki birden fazla görsel bağlantısını ; ile ayırın.",genericError:"İçe aktarma başarısız oldu."},
};

export function ProductImportPanel({ locale }: { locale: AdminLocale }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const t=C[locale];

  async function runImport() {
    if (!file) return;
    setBusy(true); setError(null); setResult(null);
    try {
      const body = new FormData(); body.append("file", file);
      const response = await fetch("/api/admin/products/import", { method: "POST", body });
      const data = await response.json().catch(()=>({}));
      if (!response.ok && !data.created && !data.updated) throw new Error(data.error || t.genericError);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.genericError);
    } finally { setBusy(false); }
  }

  return <div className="space-y-5">
    <section className="rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="text-base font-black text-foreground">{t.heading}</h2><p className="mt-2 max-w-2xl text-sm leading-7 text-muted">{t.description}</p></div><Link href="/templates/product-import-template.csv" target="_blank" className="vitalis-focus inline-flex min-h-10 items-center gap-2 rounded-xl border border-border bg-muted-bg px-4 text-xs font-bold text-foreground hover:border-primary/30"><FileSpreadsheet className="h-4 w-4" aria-hidden="true"/>{t.template}</Link></div>
      <div className="mt-6 rounded-2xl border border-dashed border-border bg-muted-bg/60 p-6 text-center">
        <input ref={inputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={e=>{const selected=e.target.files?.[0]??null;setFile(selected);setResult(null);setError(null)}}/>
        <UploadCloud className="mx-auto h-9 w-9 text-primary-glow" aria-hidden="true"/>
        <p className="mt-3 text-sm font-bold text-foreground">{file?`${t.selected}: ${file.name}`:t.choose}</p><p className="mt-1 text-xs text-muted">{t.limits}</p>
        <div className="mt-4 flex flex-wrap justify-center gap-3"><button type="button" onClick={()=>inputRef.current?.click()} className="vitalis-focus min-h-10 rounded-xl border border-border bg-white px-4 text-xs font-bold text-foreground hover:bg-muted-bg">{t.select}</button><button type="button" onClick={runImport} disabled={!file||busy} className="vitalis-focus inline-flex min-h-10 items-center gap-2 rounded-xl bg-primary px-5 text-xs font-black text-white hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-50">{busy?<Loader2 className="h-4 w-4 animate-spin" aria-hidden="true"/>:<UploadCloud className="h-4 w-4" aria-hidden="true"/>}{busy?t.busy:t.start}</button></div>
      </div>
    </section>
    {result?<section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5"><div className="flex items-center gap-2 text-sm font-black text-emerald-800"><CheckCircle2 className="h-5 w-5" aria-hidden="true"/>{t.completed}</div><div className="mt-4 grid grid-cols-3 gap-3 text-center"><Stat label={t.created} value={result.created} locale={locale}/><Stat label={t.updated} value={result.updated} locale={locale}/><Stat label={t.failed} value={result.failed} locale={locale}/></div>{result.errors?.length?<div className="mt-5 max-h-72 overflow-auto rounded-xl border border-amber-200 bg-white p-3"><p className="mb-2 flex items-center gap-1.5 text-xs font-black text-amber-800"><AlertTriangle className="h-4 w-4" aria-hidden="true"/>{t.fixRows}</p><ul className="space-y-1 text-xs text-muted">{result.errors.map((item,index)=><li key={`${item.line}-${index}`}>{t.row} {adminNumber(item.line,locale)} {item.sku?`(${item.sku})`:""}: {item.error}</li>)}</ul></div>:null}</section>:null}
    {error?<div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">{error}</div>:null}
    <section className="rounded-2xl border border-border bg-white p-5 text-sm leading-7 text-muted"><h3 className="font-black text-foreground">{t.tips}</h3><p className="mt-2">{t.tipsBody}</p></section>
  </div>;
}

function Stat({label,value,locale}:{label:string;value:number;locale:AdminLocale}){return <div className="rounded-xl bg-white p-3"><div className="text-xl font-black text-foreground tabular-nums">{adminNumber(value,locale)}</div><div className="mt-1 text-xs text-muted">{label}</div></div>}
