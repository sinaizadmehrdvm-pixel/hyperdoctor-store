import { TextField, TextAreaField, SelectField, CheckboxField } from "@/components/admin/form-field";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import { ServiceFormShell } from "@/components/admin/service-form-shell";
import { verticalOptions } from "@/lib/verticals";
import { currentAdminLocale } from "@/lib/admin-locale-server";
import type { AdminLocale } from "@/lib/admin-i18n";

type ServiceFormValues = {
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
  price?: number | null;
  priceIsFrom?: boolean;
  durationMinutes?: number | null;
  requiresBooking?: boolean;
  isPublished?: boolean;
};

type Copy = {
  base: string;
  baseDesc: string;
  slug: string;
  vertical: string;
  descriptions: string;
  commercial: string;
  commercialDesc: string;
  price: string;
  duration: string;
  image: string;
  priceFrom: string;
  booking: string;
  published: string;
};

const copy: Record<AdminLocale, Copy> = {
  fa: {
    base: "اطلاعات پایه خدمت",
    baseDesc: "نام‌ها، آدرس و حوزه فعالیت. برای انتشار، نام هر چهار زبان الزامی است.",
    slug: "اسلاگ (آدرس)",
    vertical: "حوزه فعالیت",
    descriptions: "توضیحات چهارزبانه",
    commercial: "قیمت، زمان و رزرو",
    commercialDesc: "قیمت اختیاری است؛ مدت زمان در صورت ثبت باید یک عدد صحیح مثبت باشد.",
    price: "قیمت (تومان، اختیاری)",
    duration: "مدت زمان (دقیقه)",
    image: "تصویر خدمت",
    priceFrom: "قیمت «شروع از» است",
    booking: "نیاز به رزرو نوبت دارد",
    published: "منتشر شده در سایت",
  },
  tr: {
    base: "Temel hizmet bilgileri",
    baseDesc: "Adlar, adres ve faaliyet alanı. Yayınlamak için dört dilde ad zorunludur.",
    slug: "Slug (adres)",
    vertical: "Faaliyet alanı",
    descriptions: "Dört dilli açıklamalar",
    commercial: "Fiyat, süre ve rezervasyon",
    commercialDesc: "Fiyat isteğe bağlıdır; süre girilirse pozitif bir tam sayı olmalıdır.",
    price: "Fiyat (Toman, isteğe bağlı)",
    duration: "Süre (dakika)",
    image: "Hizmet görseli",
    priceFrom: "Fiyat «başlangıç» fiyatıdır",
    booking: "Randevu gerektirir",
    published: "Sitede yayınla",
  },
  en: {
    base: "Core service information",
    baseDesc: "Names, URL and business vertical. Names in all four languages are required for publishing.",
    slug: "Slug (URL)",
    vertical: "Business vertical",
    descriptions: "Four-language descriptions",
    commercial: "Price, duration and booking",
    commercialDesc: "Price is optional; duration must be a positive integer when provided.",
    price: "Price (Toman, optional)",
    duration: "Duration (minutes)",
    image: "Service image",
    priceFrom: "Price is a starting price",
    booking: "Requires an appointment",
    published: "Published on site",
  },
  ar: {
    base: "بيانات الخدمة الأساسية",
    baseDesc: "الأسماء والرابط ومجال النشاط. يلزم الاسم باللغات الأربع للنشر.",
    slug: "الرابط (Slug)",
    vertical: "مجال النشاط",
    descriptions: "الوصف بأربع لغات",
    commercial: "السعر والمدة والحجز",
    commercialDesc: "السعر اختياري؛ وإذا أُدخلت المدة فيجب أن تكون عدداً صحيحاً موجباً.",
    price: "السعر (تومان، اختياري)",
    duration: "المدة (دقيقة)",
    image: "صورة الخدمة",
    priceFrom: "السعر يبدأ من هذا المبلغ",
    booking: "يتطلب حجز موعد",
    published: "منشور على الموقع",
  },
};

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-[#dfe4ea] bg-white p-5 shadow-[0_14px_38px_rgba(0,23,54,.04)] sm:p-6">
      <div className="mb-5">
        <h2 className="text-base font-black text-[#001736]">{title}</h2>
        {description ? <p className="mt-1 text-xs leading-6 text-[#747780]">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

export async function ServiceForm({ service }: { service?: ServiceFormValues }) {
  const locale = await currentAdminLocale();
  const t = copy[locale];
  return (
    <ServiceFormShell locale={locale}>
      {service?.id ? <input type="hidden" name="id" value={service.id} /> : null}
      <Section title={t.base} description={t.baseDesc}>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <TextField label="نام (فارسی) / Persian" name="nameFa" defaultValue={service?.nameFa} required />
          <TextField label="Ad (Türkçe) / Turkish" name="nameTr" defaultValue={service?.nameTr} dir="ltr" />
          <TextField label="Name (English)" name="nameEn" defaultValue={service?.nameEn} dir="ltr" required />
          <TextField label="الاسم (العربية) / Arabic" name="nameAr" defaultValue={service?.nameAr} />
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <TextField label={t.slug} name="slug" defaultValue={service?.slug} dir="ltr" />
          <SelectField label={t.vertical} name="vertical" defaultValue={service?.vertical ?? "RESPIRATORY_SERVICES"} options={verticalOptions(locale)} />
        </div>
      </Section>

      <Section title={t.descriptions}>
        <div className="grid gap-4 lg:grid-cols-2">
          <TextAreaField label="فارسی / Persian" name="descriptionFa" defaultValue={service?.descriptionFa} rows={6} />
          <TextAreaField label="Türkçe / Turkish" name="descriptionTr" defaultValue={service?.descriptionTr} dir="ltr" rows={6} />
          <TextAreaField label="English" name="descriptionEn" defaultValue={service?.descriptionEn} dir="ltr" rows={6} />
          <TextAreaField label="العربية / Arabic" name="descriptionAr" defaultValue={service?.descriptionAr} rows={6} />
        </div>
      </Section>

      <Section title={t.commercial} description={t.commercialDesc}>
        <div className="grid gap-4 sm:grid-cols-3">
          <TextField label={t.price} name="price" type="number" defaultValue={service?.price ?? undefined} min={0} step={1} inputMode="numeric" />
          <TextField label={t.duration} name="durationMinutes" type="number" defaultValue={service?.durationMinutes ?? undefined} min={1} step={1} inputMode="numeric" />
          <ImageUploadField label={t.image} name="image" defaultValue={service?.image} />
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <CheckboxField label={t.priceFrom} name="priceIsFrom" defaultChecked={service?.priceIsFrom ?? true} />
          <CheckboxField label={t.booking} name="requiresBooking" defaultChecked={service?.requiresBooking ?? true} />
          <CheckboxField label={t.published} name="isPublished" defaultChecked={service?.isPublished} />
        </div>
      </Section>
    </ServiceFormShell>
  );
}
