import { ImageUploadField } from "@/components/admin/image-upload-field";
import {
  createPageSection,
  deletePageSection,
  movePageSection,
  updatePageSection,
} from "@/app/admin/(protected)/pages/actions";
import { PAGE_SECTION_TYPES } from "@/lib/content/page-sections";

interface SectionRow {
  id: string;
  pageId: string;
  type: string;
  sortOrder: number;
  enabled: boolean;
  status: string;
  titleFa: string;
  titleEn: string;
  bodyFa: string;
  bodyEn: string;
  ctaLabelFa: string;
  ctaLabelEn: string;
  ctaHref: string;
  backgroundUrl: string;
  backgroundAltFa: string;
  backgroundAltEn: string;
  settings: string;
}

const TYPE_LABELS: Record<string, string> = {
  hero: "هیرو",
  richText: "متن",
  featureGrid: "شبکه ویژگی‌ها",
  cta: "دعوت به اقدام",
  gallery: "گالری",
  productGrid: "محصولات",
  serviceGrid: "خدمات",
  contact: "اطلاعات تماس",
};

const fieldClass =
  "min-h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/15";

export function PageSectionEditor({ pageId, sections }: { pageId: string; sections: SectionRow[] }) {
  return (
    <section className="mt-10 border-t border-border pt-8">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-foreground">سکشن‌های صفحه</h2>
          <p className="mt-1 text-sm text-muted">ترتیب، محتوا، انتشار و تصویر پس‌زمینه هر بخش را مدیریت کنید.</p>
        </div>
        <form action={createPageSection} className="flex items-end gap-2">
          <input type="hidden" name="pageId" value={pageId} />
          <label className="text-xs font-medium text-muted">
            نوع سکشن
            <select name="type" defaultValue="richText" className={`${fieldClass} mt-1 min-w-40`}>
              {PAGE_SECTION_TYPES.map((type) => (
                <option key={type} value={type}>{TYPE_LABELS[type] ?? type}</option>
              ))}
            </select>
          </label>
          <button type="submit" className="min-h-10 rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-primary/90">
            افزودن سکشن
          </button>
        </form>
      </div>

      <div className="space-y-5">
        {sections.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-muted-bg p-6 text-sm text-muted">
            هنوز سکشنی ساخته نشده است. تا زمان افزودن سکشن، محتوای قدیمی صفحه بدون تغییر نمایش داده می‌شود.
          </div>
        ) : null}

        {sections.map((section, index) => (
          <article key={section.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-muted-bg px-2.5 py-1 text-xs font-semibold text-foreground">{index + 1}</span>
                <span className="text-sm font-semibold text-foreground">{TYPE_LABELS[section.type] ?? section.type}</span>
                <span className={`rounded-full px-2 py-1 text-[11px] font-medium ${section.status === "PUBLISHED" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                  {section.status === "PUBLISHED" ? "منتشر" : "پیش‌نویس"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <form action={movePageSection.bind(null, section.id, "up")}>
                  <button disabled={index === 0} className="min-h-9 rounded-lg border border-border px-3 text-xs disabled:opacity-30">↑ بالا</button>
                </form>
                <form action={movePageSection.bind(null, section.id, "down")}>
                  <button disabled={index === sections.length - 1} className="min-h-9 rounded-lg border border-border px-3 text-xs disabled:opacity-30">↓ پایین</button>
                </form>
                <form action={deletePageSection.bind(null, section.id)}>
                  <button className="min-h-9 rounded-lg border border-red-200 px-3 text-xs font-medium text-red-600 hover:bg-red-50">حذف</button>
                </form>
              </div>
            </div>

            <form action={updatePageSection} className="space-y-5">
              <input type="hidden" name="id" value={section.id} />
              <div className="grid gap-4 md:grid-cols-3">
                <label className="text-xs font-medium text-muted">نوع
                  <select name="type" defaultValue={section.type} className={`${fieldClass} mt-1`}>
                    {PAGE_SECTION_TYPES.map((type) => <option key={type} value={type}>{TYPE_LABELS[type] ?? type}</option>)}
                  </select>
                </label>
                <label className="text-xs font-medium text-muted">وضعیت
                  <select name="status" defaultValue={section.status} className={`${fieldClass} mt-1`}>
                    <option value="DRAFT">پیش‌نویس</option>
                    <option value="PUBLISHED">منتشر</option>
                  </select>
                </label>
                <label className="flex min-h-10 items-center gap-2 self-end text-sm text-foreground">
                  <input type="checkbox" name="enabled" defaultChecked={section.enabled} className="h-4 w-4 accent-primary" /> فعال باشد
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-xs font-medium text-muted">عنوان فارسی
                  <input name="titleFa" defaultValue={section.titleFa} className={`${fieldClass} mt-1`} />
                </label>
                <label className="text-xs font-medium text-muted">English title
                  <input name="titleEn" defaultValue={section.titleEn} dir="ltr" className={`${fieldClass} mt-1`} />
                </label>
                <label className="text-xs font-medium text-muted">متن فارسی
                  <textarea name="bodyFa" defaultValue={section.bodyFa} rows={5} className={`${fieldClass} mt-1 resize-y`} />
                </label>
                <label className="text-xs font-medium text-muted">English body
                  <textarea name="bodyEn" defaultValue={section.bodyEn} rows={5} dir="ltr" className={`${fieldClass} mt-1 resize-y`} />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <label className="text-xs font-medium text-muted">متن دکمه فارسی
                  <input name="ctaLabelFa" defaultValue={section.ctaLabelFa} className={`${fieldClass} mt-1`} />
                </label>
                <label className="text-xs font-medium text-muted">English button
                  <input name="ctaLabelEn" defaultValue={section.ctaLabelEn} dir="ltr" className={`${fieldClass} mt-1`} />
                </label>
                <label className="text-xs font-medium text-muted">لینک دکمه
                  <input name="ctaHref" defaultValue={section.ctaHref} dir="ltr" className={`${fieldClass} mt-1`} placeholder="/fa/contact" />
                </label>
              </div>

              <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                <ImageUploadField name="backgroundUrl" label="تصویر پس‌زمینه سکشن" defaultValue={section.backgroundUrl} />
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="text-xs font-medium text-muted">Alt فارسی
                    <input name="backgroundAltFa" defaultValue={section.backgroundAltFa} className={`${fieldClass} mt-1`} />
                  </label>
                  <label className="text-xs font-medium text-muted">Alt English
                    <input name="backgroundAltEn" defaultValue={section.backgroundAltEn} dir="ltr" className={`${fieldClass} mt-1`} />
                  </label>
                </div>
              </div>

              <label className="block text-xs font-medium text-muted">تنظیمات JSON (پیشرفته)
                <textarea name="settings" defaultValue={section.settings} rows={3} dir="ltr" className={`${fieldClass} mt-1 font-mono text-xs`} />
              </label>

              <button type="submit" className="min-h-10 rounded-lg bg-primary px-5 text-sm font-medium text-white hover:bg-primary/90">ذخیره سکشن</button>
            </form>
          </article>
        ))}
      </div>
    </section>
  );
}
