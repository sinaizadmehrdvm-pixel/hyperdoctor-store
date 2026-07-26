import { prisma } from "@/lib/prisma";
import { TextField, TextAreaField, SelectField, CheckboxField } from "@/components/admin/form-field";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import { SpecsEditor } from "@/components/admin/specs-editor";
import { VERTICAL_OPTIONS } from "@/lib/verticals";
import { upsertProduct } from "@/app/admin/(protected)/products/actions";

type ProductFormValues = {
  id?: string;
  vertical?: string;
  categoryId?: string;
  slug?: string;
  nameFa?: string;
  nameEn?: string;
  descriptionFa?: string | null;
  descriptionEn?: string | null;
  brand?: string;
  sku?: string;
  price?: number;
  compareAtPrice?: number | null;
  stock?: number;
  specs?: string;
  isPublished?: boolean;
  isFeatured?: boolean;
  images?: { url: string }[];
};

export async function ProductForm({ product }: { product?: ProductFormValues }) {
  const categories = await prisma.category.findMany({ orderBy: { order: "asc" } });

  return (
    <form action={upsertProduct} className="max-w-2xl space-y-5">
      {product?.id ? <input type="hidden" name="id" value={product.id} /> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="نام (فارسی)" name="nameFa" defaultValue={product?.nameFa} required />
        <TextField label="نام (English)" name="nameEn" defaultValue={product?.nameEn} dir="ltr" required />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <TextField label="اسلاگ" name="slug" defaultValue={product?.slug} dir="ltr" />
        <SelectField
          label="دسته‌بندی"
          name="categoryId"
          defaultValue={product?.categoryId ?? categories[0]?.id}
          options={categories.map((c) => ({ value: c.id, label: c.nameFa }))}
        />
        <SelectField
          label="حوزه فعالیت"
          name="vertical"
          defaultValue={product?.vertical ?? "MEDICAL_EQUIPMENT"}
          options={VERTICAL_OPTIONS}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="برند" name="brand" defaultValue={product?.brand} />
        <TextField label="کد کالا (SKU)" name="sku" defaultValue={product?.sku} dir="ltr" required />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <TextField label="قیمت (تومان)" name="price" type="number" defaultValue={product?.price} required />
        <TextField
          label="قیمت قبل از تخفیف (اختیاری)"
          name="compareAtPrice"
          type="number"
          defaultValue={product?.compareAtPrice ?? undefined}
        />
        <TextField label="موجودی انبار" name="stock" type="number" defaultValue={product?.stock ?? 0} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <TextAreaField label="توضیحات (فارسی)" name="descriptionFa" defaultValue={product?.descriptionFa} />
        <TextAreaField label="توضیحات (English)" name="descriptionEn" defaultValue={product?.descriptionEn} dir="ltr" />
      </div>

      <ImageUploadField label="تصویر اصلی" name="imageUrl" defaultValue={product?.images?.[0]?.url} />

      <SpecsEditor name="specs" defaultValue={product?.specs} />

      <div className="flex gap-6">
        <CheckboxField label="منتشر شده (در سایت نمایش داده شود)" name="isPublished" defaultChecked={product?.isPublished} />
        <CheckboxField label="محصول ویژه (در صفحه اصلی)" name="isFeatured" defaultChecked={product?.isFeatured} />
      </div>

      <button
        type="submit"
        className="min-h-11 cursor-pointer rounded-lg bg-primary px-6 text-sm font-medium text-white hover:bg-primary/90"
      >
        ذخیره
      </button>
    </form>
  );
}
