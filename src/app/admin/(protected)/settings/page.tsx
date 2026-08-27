import { TextField, SelectField } from "@/components/admin/form-field";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import { adminRpc } from "@/lib/admin-data";
import { updateSiteSettings } from "./actions";

type Settings = {
  holdingName: string;
  holdingLogoUrl: string;
  subBrandName: string;
  subBrandLogoUrl: string;
  contactPhone: string;
  contactEmail: string;
  address: string;
  instagramUrl: string;
  telegramUrl: string;
  whatsappUrl: string;
  defaultLocale: string;
  supportedLocales: string;
  currency: string;
};

export default async function AdminSettingsPage() {
  const settings = await adminRpc<Settings | null>("admin_site_settings") ?? {
    holdingName: "VITALIS Group",
    holdingLogoUrl: "",
    subBrandName: "Hyper Doctor",
    subBrandLogoUrl: "",
    contactPhone: "",
    contactEmail: "",
    address: "",
    instagramUrl: "",
    telegramUrl: "",
    whatsappUrl: "",
    defaultLocale: "fa",
    supportedLocales: "fa,tr,en,ar",
    currency: "IRT",
  };

  return (
    <div>
      <div className="mb-6"><p className="text-xs font-black uppercase tracking-[.16em] text-muted">System Configuration</p><h1 className="mt-2 text-2xl font-black text-foreground">تنظیمات سایت</h1></div>

      <form action={updateSiteSettings} className="max-w-4xl space-y-5 pb-12">
        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-black text-foreground">برند</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="نام هلدینگ" name="holdingName" defaultValue={settings.holdingName} />
            <TextField label="نام برند فروشگاه" name="subBrandName" defaultValue={settings.subBrandName} />
            <ImageUploadField label="لوگوی هلدینگ" name="holdingLogoUrl" defaultValue={settings.holdingLogoUrl} />
            <ImageUploadField label="لوگوی فروشگاه" name="subBrandLogoUrl" defaultValue={settings.subBrandLogoUrl} />
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-black text-foreground">اطلاعات تماس</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="تلفن تماس" name="contactPhone" defaultValue={settings.contactPhone} dir="ltr" />
            <TextField label="ایمیل" name="contactEmail" defaultValue={settings.contactEmail} dir="ltr" />
          </div>
          <TextField label="آدرس" name="address" defaultValue={settings.address} className="mt-4" />
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-black text-foreground">شبکه‌های اجتماعی</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <TextField label="اینستاگرام" name="instagramUrl" defaultValue={settings.instagramUrl} dir="ltr" />
            <TextField label="تلگرام" name="telegramUrl" defaultValue={settings.telegramUrl} dir="ltr" />
            <TextField label="واتس‌اپ" name="whatsappUrl" defaultValue={settings.whatsappUrl} dir="ltr" />
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-black text-foreground">زبان و واحد پول</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField label="زبان پیش‌فرض" name="defaultLocale" defaultValue={settings.defaultLocale} options={[{ value: "fa", label: "فارسی" },{ value: "tr", label: "Türkçe" },{ value: "en", label: "English" },{ value: "ar", label: "العربية" }]} />
            <SelectField label="واحد پول پایه" name="currency" defaultValue={settings.currency} options={[{ value: "IRT", label: "تومان ایران (IRT)" },{ value: "TRY", label: "لیر ترکیه (TRY)" },{ value: "USD", label: "دلار آمریکا (USD)" },{ value: "EUR", label: "یورو (EUR)" }]} />
          </div>
          <p className="mt-3 text-xs leading-6 text-muted">زبان‌های فعال سایت به‌صورت ثابت FA / TR / EN / AR نگهداری می‌شوند تا هیچ صفحه‌ای از چرخه چهارزبانه خارج نشود.</p>
        </section>

        <div className="sticky bottom-4 z-20 flex justify-end"><button type="submit" className="min-h-12 cursor-pointer rounded-xl bg-primary px-7 text-sm font-black text-white shadow-[0_14px_30px_rgba(0,23,54,.18)] hover:bg-primary/90">ذخیره تغییرات</button></div>
      </form>
    </div>
  );
}
