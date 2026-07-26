import { TextField, CheckboxField } from "@/components/admin/form-field";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { upsertPage } from "@/app/admin/(protected)/pages/actions";

type PageFormValues = {
  id?: string;
  slug?: string;
  titleFa?: string;
  titleEn?: string;
  contentFa?: string;
  contentEn?: string;
  isPublished?: boolean;
  showInNav?: boolean;
  navOrder?: number;
};

export function PageForm({ page }: { page?: PageFormValues }) {
  return (
    <form action={upsertPage} className="max-w-3xl space-y-5">
      {page?.id ? <input type="hidden" name="id" value={page.id} /> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="عنوان (فارسی)" name="titleFa" defaultValue={page?.titleFa} required />
        <TextField label="عنوان (English)" name="titleEn" defaultValue={page?.titleEn} dir="ltr" required />
      </div>

      <TextField label="اسلاگ (آدرس صفحه)" name="slug" defaultValue={page?.slug} dir="ltr" />

      <div>
        <span className="mb-1.5 block text-xs font-medium text-muted">محتوا (فارسی)</span>
        <RichTextEditor name="contentFa" defaultValue={page?.contentFa} dir="rtl" />
      </div>

      <div>
        <span className="mb-1.5 block text-xs font-medium text-muted">Content (English)</span>
        <RichTextEditor name="contentEn" defaultValue={page?.contentEn} dir="ltr" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <TextField label="ترتیب در منو" name="navOrder" type="number" defaultValue={page?.navOrder ?? 0} />
      </div>

      <div className="flex gap-6">
        <CheckboxField label="منتشر شده" name="isPublished" defaultChecked={page?.isPublished} />
        <CheckboxField label="نمایش در منوی سایت" name="showInNav" defaultChecked={page?.showInNav} />
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
