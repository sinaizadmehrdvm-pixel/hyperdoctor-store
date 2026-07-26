import { TextField, TextAreaField, SelectField, CheckboxField } from "@/components/admin/form-field";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import { VERTICAL_OPTIONS } from "@/lib/verticals";
import { upsertService } from "@/app/admin/(protected)/services/actions";

type ServiceFormValues = {
  id?: string;
  vertical?: string;
  slug?: string;
  nameFa?: string;
  nameEn?: string;
  descriptionFa?: string | null;
  descriptionEn?: string | null;
  image?: string | null;
  price?: number | null;
  priceIsFrom?: boolean;
  durationMinutes?: number | null;
  requiresBooking?: boolean;
  isPublished?: boolean;
};

export function ServiceForm({ service }: { service?: ServiceFormValues }) {
  return (
    <form action={upsertService} className="max-w-2xl space-y-5">
      {service?.id ? <input type="hidden" name="id" value={service.id} /> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="نام (فارسی)" name="nameFa" defaultValue={service?.nameFa} required />
        <TextField label="نام (English)" name="nameEn" defaultValue={service?.nameEn} dir="ltr" required />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="اسلاگ" name="slug" defaultValue={service?.slug} dir="ltr" />
        <SelectField
          label="حوزه فعالیت"
          name="vertical"
          defaultValue={service?.vertical ?? "RESPIRATORY_SERVICES"}
          options={VERTICAL_OPTIONS}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <TextAreaField label="توضیحات (فارسی)" name="descriptionFa" defaultValue={service?.descriptionFa} />
        <TextAreaField label="توضیحات (English)" name="descriptionEn" defaultValue={service?.descriptionEn} dir="ltr" />
      </div>

      <ImageUploadField label="تصویر خدمت" name="image" defaultValue={service?.image} />

      <div className="grid gap-4 sm:grid-cols-3">
        <TextField label="قیمت (تومان، اختیاری)" name="price" type="number" defaultValue={service?.price ?? undefined} />
        <TextField label="مدت زمان (دقیقه)" name="durationMinutes" type="number" defaultValue={service?.durationMinutes ?? undefined} />
      </div>

      <div className="flex flex-wrap gap-6">
        <CheckboxField label="قیمت «شروع از» است" name="priceIsFrom" defaultChecked={service?.priceIsFrom ?? true} />
        <CheckboxField label="نیاز به رزرو نوبت دارد" name="requiresBooking" defaultChecked={service?.requiresBooking ?? true} />
        <CheckboxField label="منتشر شده" name="isPublished" defaultChecked={service?.isPublished} />
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
