import Image from "next/image";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import {
  addProductMedia,
  deleteProductMedia,
  moveProductMedia,
  setPrimaryProductMedia,
  updateProductMedia,
} from "@/app/admin/(protected)/products/actions";

interface ProductMediaRow {
  id: string;
  url: string;
  altFa: string;
  altEn: string;
  sortOrder: number;
  isPrimary: boolean;
  isPublished: boolean;
}

const fieldClass = "min-h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/15";

export function ProductMediaEditor({ productId, media }: { productId: string; media: ProductMediaRow[] }) {
  return (
    <section className="mt-10 border-t border-border pt-8">
      <div className="mb-5">
        <h2 className="text-lg font-bold text-foreground">گالری محصول</h2>
        <p className="mt-1 text-sm text-muted">چند تصویر، ترتیب نمایش، تصویر اصلی، متن جایگزین و وضعیت انتشار را مدیریت کنید.</p>
      </div>

      <form action={addProductMedia} className="mb-6 rounded-2xl border border-dashed border-border bg-muted-bg p-5">
        <input type="hidden" name="productId" value={productId} />
        <ImageUploadField name="url" label="تصویر جدید" />
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-medium text-muted">Alt فارسی
            <input name="altFa" className={`${fieldClass} mt-1`} />
          </label>
          <label className="text-xs font-medium text-muted">Alt English
            <input name="altEn" dir="ltr" className={`${fieldClass} mt-1`} />
          </label>
        </div>
        <label className="mt-4 flex items-center gap-2 text-sm text-foreground">
          <input type="checkbox" name="isPublished" defaultChecked className="h-4 w-4 accent-primary" /> انتشار در سایت
        </label>
        <button type="submit" className="mt-4 min-h-10 rounded-lg bg-primary px-5 text-sm font-medium text-white hover:bg-primary/90">افزودن به گالری</button>
      </form>

      <div className="space-y-4">
        {media.length === 0 ? <p className="rounded-xl border border-border p-5 text-sm text-muted">هنوز تصویری برای این محصول ثبت نشده است.</p> : null}
        {media.map((item, index) => (
          <article key={item.id} className="grid gap-4 rounded-2xl border border-border bg-card p-4 md:grid-cols-[112px_minmax(0,1fr)]">
            <div className="relative aspect-square overflow-hidden rounded-xl border border-border bg-muted-bg">
              <Image src={item.url} alt="" fill className="object-cover" sizes="112px" />
              {item.isPrimary ? <span className="absolute start-2 top-2 rounded-full bg-primary px-2 py-1 text-[10px] font-bold text-white">اصلی</span> : null}
            </div>
            <div>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex gap-2">
                  <form action={moveProductMedia.bind(null, item.id, "up")}>
                    <button disabled={index === 0} className="min-h-8 rounded-lg border border-border px-2.5 text-xs disabled:opacity-30">↑</button>
                  </form>
                  <form action={moveProductMedia.bind(null, item.id, "down")}>
                    <button disabled={index === media.length - 1} className="min-h-8 rounded-lg border border-border px-2.5 text-xs disabled:opacity-30">↓</button>
                  </form>
                  {!item.isPrimary ? (
                    <form action={setPrimaryProductMedia.bind(null, item.id)}>
                      <button className="min-h-8 rounded-lg border border-primary/30 px-2.5 text-xs font-medium text-primary">انتخاب به‌عنوان تصویر اصلی</button>
                    </form>
                  ) : null}
                </div>
                <form action={deleteProductMedia.bind(null, item.id)}>
                  <button className="min-h-8 rounded-lg border border-red-200 px-2.5 text-xs font-medium text-red-600 hover:bg-red-50">حذف</button>
                </form>
              </div>

              <form action={updateProductMedia} className="grid gap-3 sm:grid-cols-2">
                <input type="hidden" name="id" value={item.id} />
                <label className="text-xs font-medium text-muted">Alt فارسی
                  <input name="altFa" defaultValue={item.altFa} className={`${fieldClass} mt-1`} />
                </label>
                <label className="text-xs font-medium text-muted">Alt English
                  <input name="altEn" defaultValue={item.altEn} dir="ltr" className={`${fieldClass} mt-1`} />
                </label>
                <label className="flex items-center gap-2 text-sm text-foreground sm:col-span-2">
                  <input type="checkbox" name="isPublished" defaultChecked={item.isPublished} className="h-4 w-4 accent-primary" /> انتشار در سایت
                </label>
                <button type="submit" className="min-h-9 justify-self-start rounded-lg bg-navy px-4 text-xs font-medium text-white">ذخیره تصویر</button>
              </form>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
