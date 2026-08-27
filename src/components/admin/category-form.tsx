import { TextField, TextAreaField, SelectField, CheckboxField } from "@/components/admin/form-field";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import { VERTICAL_OPTIONS } from "@/lib/verticals";
import { upsertCategory } from "@/app/admin/(protected)/categories/actions";

type CategoryFormValues = {
  id?: string;
  vertical?: string;
  slug?: string;
  nameFa?: string;
  nameTr?: string;
  nameEn?: string;
  nameAr?: string;
  descriptionFa?: string | null;
  descriptionTr?: string | null;
  descriptionEn?: string | null;
  descriptionAr?: string | null;
  image?: string | null;
  order?: number;
  isPublished?: boolean;
};

export function CategoryForm({ category }: { category?: CategoryFormValues }) {
  return (
    <form action={upsertCategory} className="max-w-4xl space-y-5 pb-12">
      {category?.id ? <input type="hidden" name="id" value={category.id} /> : null}

      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <h2 className="text-sm font-black text-foreground">عنوان و ساختار</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <TextField label="نام (فارسی)" name="nameFa" defaultValue={category?.nameFa} required />
          <TextField label="نام (Türkçe)" name="nameTr" defaultValue={category?.nameTr} dir="ltr" />
          <TextField label="نام (English)" name="nameEn" defaultValue={category?.nameEn} dir="ltr" required />
          <TextField label="نام (العربية)" name="nameAr" defaultValue={category?.nameAr} />
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <TextField label="اسلاگ (آدرس)" name="slug" defaultValue={category?.slug} dir="ltr" className="[&_input]:font-mono" />
          <SelectField label="حوزه فعالیت" name="vertical" defaultValue={category?.vertical ?? "MEDICAL_EQUIPMENT"} options={VERTICAL_OPTIONS} />
          <TextField label="ترتیب نمایش" name="order" type="number" defaultValue={category?.order ?? 0} />
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <h2 className="text-sm font-black text-foreground">توضیحات چهارزبانه</h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <TextAreaField label="توضیحات فارسی" name="descriptionFa" defaultValue={category?.descriptionFa} />
          <TextAreaField label="Türkçe açıklama" name="descriptionTr" defaultValue={category?.descriptionTr} dir="ltr" />
          <TextAreaField label="English description" name="descriptionEn" defaultValue={category?.descriptionEn} dir="ltr" />
          <TextAreaField label="الوصف العربي" name="descriptionAr" defaultValue={category?.descriptionAr} />
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <h2 className="text-sm font-black text-foreground">تصویر و انتشار</h2>
        <div className="mt-4 space-y-4">
          <ImageUploadField label="تصویر دسته‌بندی" name="image" defaultValue={category?.image} />
          <CheckboxField label="نمایش این دسته‌بندی در سایت" name="isPublished" defaultChecked={category?.isPublished ?? true} />
        </div>
      </section>

      <div className="sticky bottom-4 z-20 flex justify-end">
        <button type="submit" className="min-h-12 cursor-pointer rounded-xl bg-primary px-7 text-sm font-black text-white shadow-[0_14px_30px_rgba(0,23,54,.18)] hover:bg-primary/90">ذخیره دسته‌بندی</button>
      </div>
    </form>
  );
}
