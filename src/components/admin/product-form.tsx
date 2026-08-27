import { TextField, TextAreaField, SelectField, CheckboxField } from "@/components/admin/form-field";
import { MultiImageUploadField } from "@/components/admin/multi-image-upload-field";
import { SpecsEditor } from "@/components/admin/specs-editor";
import { VERTICAL_OPTIONS } from "@/lib/verticals";
import { adminRpc } from "@/lib/admin-data";
import { upsertProduct } from "@/app/admin/(protected)/products/actions";

type ProductFormValues = {
  id?: string; vertical?: string; categoryId?: string; slug?: string; nameFa?: string; nameTr?: string; nameEn?: string; nameAr?: string;
  descriptionFa?: string | null; descriptionTr?: string | null; descriptionEn?: string | null; descriptionAr?: string | null;
  brand?: string; modelNumber?: string; sku?: string; barcode?: string; gtin?: string; manufacturer?: string; countryOfOrigin?: string;
  price?: number; compareAtPrice?: number | null; costPrice?: number | null; stock?: number; lowStockThreshold?: number; minOrderQty?: number; maxOrderQty?: number | null;
  weightGrams?: number | null; lengthMm?: number | null; widthMm?: number | null; heightMm?: number | null; warrantyMonths?: number | null;
  specs?: string; tags?: string; seoTitleFa?: string; seoTitleTr?: string; seoTitleEn?: string; seoTitleAr?: string;
  seoDescriptionFa?: string; seoDescriptionTr?: string; seoDescriptionEn?: string; seoDescriptionAr?: string;
  isPublished?: boolean; isFeatured?: boolean; isNewArrival?: boolean; images?: { url: string }[];
};

type CategoryBundle = { categories: Array<{ id:string; nameFa:string; nameEn:string; vertical:string; isPublished?:boolean }> };

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return <section className="rounded-3xl border border-[#dfe4ea] bg-white p-5 shadow-[0_14px_38px_rgba(0,23,54,.04)] sm:p-6"><div className="mb-5"><h2 className="text-base font-black text-[#001736]">{title}</h2>{description ? <p className="mt-1 text-xs leading-6 text-[#747780]">{description}</p> : null}</div>{children}</section>;
}

export async function ProductForm({ product }: { product?: ProductFormValues }) {
  const bundle = await adminRpc<CategoryBundle>("admin_products_bundle", { p_search: "" });
  const categories = bundle.categories.filter((category) => category.isPublished !== false);

  return (
    <form action={upsertProduct} className="max-w-7xl space-y-5 pb-20">
      {product?.id ? <input type="hidden" name="id" value={product.id} /> : null}

      <Section title="اطلاعات پایه محصول" description="نام‌ها، شناسه‌ها، دسته‌بندی و برند. اطلاعات فارسی و انگلیسی برای انتشار اولیه الزامی‌اند.">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"><TextField label="نام (فارسی)" name="nameFa" defaultValue={product?.nameFa} required /><TextField label="نام (Türkçe)" name="nameTr" defaultValue={product?.nameTr} dir="ltr" /><TextField label="نام (English)" name="nameEn" defaultValue={product?.nameEn} dir="ltr" required /><TextField label="نام (العربية)" name="nameAr" defaultValue={product?.nameAr} /></div>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4"><TextField label="اسلاگ URL" name="slug" defaultValue={product?.slug} dir="ltr" /><TextField label="کد کالا (SKU)" name="sku" defaultValue={product?.sku} dir="ltr" required /><TextField label="مدل" name="modelNumber" defaultValue={product?.modelNumber} dir="ltr" /><TextField label="برند" name="brand" defaultValue={product?.brand} /></div>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4"><SelectField label="دسته‌بندی" name="categoryId" defaultValue={product?.categoryId ?? categories[0]?.id} options={categories.map((category) => ({ value: category.id, label: category.nameFa }))} /><SelectField label="حوزه فعالیت" name="vertical" defaultValue={product?.vertical ?? "MEDICAL_EQUIPMENT"} options={VERTICAL_OPTIONS} /><TextField label="سازنده" name="manufacturer" defaultValue={product?.manufacturer} /><TextField label="کشور سازنده" name="countryOfOrigin" defaultValue={product?.countryOfOrigin} /></div>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4"><TextField label="Barcode" name="barcode" defaultValue={product?.barcode} dir="ltr" /><TextField label="GTIN / EAN" name="gtin" defaultValue={product?.gtin} dir="ltr" /><TextField label="مدت گارانتی (ماه)" name="warrantyMonths" type="number" defaultValue={product?.warrantyMonths} /><TextField label="برچسب‌ها (JSON Array)" name="tags" defaultValue={product?.tags ?? "[]"} dir="ltr" /></div>
      </Section>

      <Section title="قیمت، موجودی و لجستیک" description="قیمت‌ها بر حسب واحد مالی فروشگاه ذخیره می‌شوند؛ موجودی و محدودیت سفارش مستقیماً در Checkout اعتبارسنجی خواهند شد.">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"><TextField label="قیمت فروش" name="price" type="number" defaultValue={product?.price} required /><TextField label="قیمت قبل از تخفیف" name="compareAtPrice" type="number" defaultValue={product?.compareAtPrice} /><TextField label="قیمت خرید / بهای تمام‌شده" name="costPrice" type="number" defaultValue={product?.costPrice} /><TextField label="موجودی" name="stock" type="number" defaultValue={product?.stock ?? 0} required /></div>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4"><TextField label="هشدار کمبود موجودی" name="lowStockThreshold" type="number" defaultValue={product?.lowStockThreshold ?? 2} /><TextField label="حداقل تعداد سفارش" name="minOrderQty" type="number" defaultValue={product?.minOrderQty ?? 1} /><TextField label="حداکثر تعداد سفارش" name="maxOrderQty" type="number" defaultValue={product?.maxOrderQty} /><TextField label="وزن (گرم)" name="weightGrams" type="number" defaultValue={product?.weightGrams} /></div>
        <div className="mt-4 grid gap-4 md:grid-cols-3"><TextField label="طول (میلی‌متر)" name="lengthMm" type="number" defaultValue={product?.lengthMm} /><TextField label="عرض (میلی‌متر)" name="widthMm" type="number" defaultValue={product?.widthMm} /><TextField label="ارتفاع (میلی‌متر)" name="heightMm" type="number" defaultValue={product?.heightMm} /></div>
      </Section>

      <Section title="توضیحات چهارزبانه"><div className="grid gap-4 lg:grid-cols-2"><TextAreaField label="توضیحات فارسی" name="descriptionFa" defaultValue={product?.descriptionFa} rows={7} /><TextAreaField label="Türkçe açıklama" name="descriptionTr" defaultValue={product?.descriptionTr} rows={7} dir="ltr" /><TextAreaField label="English description" name="descriptionEn" defaultValue={product?.descriptionEn} rows={7} dir="ltr" /><TextAreaField label="الوصف العربي" name="descriptionAr" defaultValue={product?.descriptionAr} rows={7} /></div></Section>

      <Section title="تصاویر محصول" description="تصویر اول در کارت محصول نمایش داده می‌شود. حداکثر ۸ تصویر در ویرایشگر و ۱۲ تصویر در لایه داده پشتیبانی می‌شود."><MultiImageUploadField label="گالری تصاویر" name="imageUrls" defaultValues={product?.images?.map((image) => image.url) ?? []} maxImages={8} /></Section>

      <SpecsEditor name="specs" defaultValue={product?.specs} />

      <Section title="SEO چهارزبانه"><div className="grid gap-4 lg:grid-cols-2"><TextField label="SEO Title فارسی" name="seoTitleFa" defaultValue={product?.seoTitleFa} /><TextField label="SEO Title Türkçe" name="seoTitleTr" defaultValue={product?.seoTitleTr} dir="ltr" /><TextField label="SEO Title English" name="seoTitleEn" defaultValue={product?.seoTitleEn} dir="ltr" /><TextField label="SEO Title العربية" name="seoTitleAr" defaultValue={product?.seoTitleAr} /><TextAreaField label="SEO Description فارسی" name="seoDescriptionFa" defaultValue={product?.seoDescriptionFa} rows={3} /><TextAreaField label="SEO Description Türkçe" name="seoDescriptionTr" defaultValue={product?.seoDescriptionTr} rows={3} dir="ltr" /><TextAreaField label="SEO Description English" name="seoDescriptionEn" defaultValue={product?.seoDescriptionEn} rows={3} dir="ltr" /><TextAreaField label="SEO Description العربية" name="seoDescriptionAr" defaultValue={product?.seoDescriptionAr} rows={3} /></div></Section>

      <Section title="وضعیت انتشار"><div className="grid gap-2 md:grid-cols-3"><CheckboxField label="منتشر شده در سایت" name="isPublished" defaultChecked={product?.isPublished} /><CheckboxField label="محصول ویژه / صفحه اصلی" name="isFeatured" defaultChecked={product?.isFeatured} /><CheckboxField label="محصول جدید" name="isNewArrival" defaultChecked={product?.isNewArrival} /></div></Section>

      <div className="sticky bottom-4 z-20 flex justify-end"><button type="submit" className="vitalis-focus min-h-12 cursor-pointer rounded-2xl bg-[#ba0036] px-8 text-sm font-black text-white shadow-[0_16px_35px_rgba(186,0,54,.22)] transition hover:bg-[#e80346]">ذخیره محصول</button></div>
    </form>
  );
}
