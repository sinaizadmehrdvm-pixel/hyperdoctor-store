import { TextField, TextAreaField, SelectField } from "@/components/admin/form-field";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import { VERTICAL_OPTIONS } from "@/lib/verticals";
import { upsertCategory } from "@/app/admin/(protected)/categories/actions";

type CategoryFormValues = {
  id?: string;
  vertical?: string;
  slug?: string;
  nameFa?: string;
  nameEn?: string;
  descriptionFa?: string | null;
  descriptionEn?: string | null;
  image?: string | null;
  order?: number;
};

export function CategoryForm({ category }: { category?: CategoryFormValues }) {
  return (
    <form action={upsertCategory} className="max-w-2xl space-y-5">
      {category?.id ? <input type="hidden" name="id" value={category.id} /> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="نام (فارسی)" name="nameFa" defaultValue={category?.nameFa} required />
        <TextField label="نام (English)" name="nameEn" defaultValue={category?.nameEn} dir="ltr" required />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="اسلاگ (آدرس)"
          name="slug"
          defaultValue={category?.slug}
          dir="ltr"
          className="[&_input]:font-mono"
        />
        <SelectField
          label="حوزه فعالیت"
          name="vertical"
          defaultValue={category?.vertical ?? "MEDICAL_EQUIPMENT"}
          options={VERTICAL_OPTIONS}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <TextAreaField
          label="توضیحات (فارسی)"
          name="descriptionFa"
          defaultValue={category?.descriptionFa}
        />
        <TextAreaField
          label="توضیحات (English)"
          name="descriptionEn"
          defaultValue={category?.descriptionEn}
          dir="ltr"
        />
      </div>

      <ImageUploadField label="تصویر دسته‌بندی" name="image" defaultValue={category?.image} />

      <TextField label="ترتیب نمایش" name="order" type="number" defaultValue={category?.order ?? 0} />

      <button
        type="submit"
        className="min-h-11 cursor-pointer rounded-lg bg-primary px-6 text-sm font-medium text-white hover:bg-primary/90"
      >
        ذخیره
      </button>
    </form>
  );
}
