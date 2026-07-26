import { getSiteSettings } from "@/lib/site-data";
import { TextField } from "@/components/admin/form-field";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import { updateSiteSettings } from "./actions";

export default async function AdminSettingsPage() {
  const settings = await getSiteSettings();

  return (
    <div>
      <h1 className="text-xl font-bold text-foreground mb-6">تنظیمات سایت</h1>

      <form action={updateSiteSettings} className="max-w-2xl space-y-8">
        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-4 text-sm font-semibold text-foreground">برند</h2>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="نام هلدینگ" name="holdingName" defaultValue={settings.holdingName} />
              <TextField label="نام برند فروشگاه" name="subBrandName" defaultValue={settings.subBrandName} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <ImageUploadField label="لوگوی هلدینگ" name="holdingLogoUrl" defaultValue={settings.holdingLogoUrl} />
              <ImageUploadField label="لوگوی فروشگاه" name="subBrandLogoUrl" defaultValue={settings.subBrandLogoUrl} />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-4 text-sm font-semibold text-foreground">اطلاعات تماس</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="تلفن تماس" name="contactPhone" defaultValue={settings.contactPhone} dir="ltr" />
            <TextField label="ایمیل" name="contactEmail" defaultValue={settings.contactEmail} dir="ltr" />
          </div>
          <TextField label="آدرس" name="address" defaultValue={settings.address} className="mt-4" />
        </section>

        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-4 text-sm font-semibold text-foreground">شبکه‌های اجتماعی</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <TextField label="اینستاگرام" name="instagramUrl" defaultValue={settings.instagramUrl} dir="ltr" />
            <TextField label="تلگرام" name="telegramUrl" defaultValue={settings.telegramUrl} dir="ltr" />
            <TextField label="واتس‌اپ" name="whatsappUrl" defaultValue={settings.whatsappUrl} dir="ltr" />
          </div>
        </section>

        <button
          type="submit"
          className="min-h-11 cursor-pointer rounded-lg bg-primary px-6 text-sm font-medium text-white hover:bg-primary/90"
        >
          ذخیره تغییرات
        </button>
      </form>
    </div>
  );
}
