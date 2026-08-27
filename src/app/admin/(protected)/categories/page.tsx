import Link from "next/link";
import { Plus, Pencil } from "lucide-react";
import { DeleteButton } from "@/components/admin/delete-button";
import { VERTICAL_OPTIONS } from "@/lib/verticals";
import { adminRpc } from "@/lib/admin-data";
import { deleteCategory } from "./actions";

type AdminCategory = {
  id: string;
  vertical: string;
  slug: string;
  nameFa: string;
  nameTr: string;
  nameEn: string;
  nameAr: string;
  order: number;
  isPublished: boolean;
  productCount: number;
};

export default async function AdminCategoriesPage() {
  const categories = await adminRpc<AdminCategory[]>("admin_categories_bundle");

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div><p className="text-xs font-black uppercase tracking-[.16em] text-muted">Catalog Structure</p><h1 className="mt-2 text-2xl font-black text-foreground">دسته‌بندی‌ها</h1></div>
        <Link href="/admin/categories/new" className="flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-black text-white hover:bg-primary/90"><Plus className="h-4 w-4" />دسته‌بندی جدید</Link>
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border bg-muted-bg/50 text-xs text-muted"><th className="px-4 py-3 text-start">نام</th><th className="px-4 py-3 text-start">حوزه</th><th className="px-4 py-3 text-start">محصول</th><th className="px-4 py-3 text-start">انتشار</th><th className="px-4 py-3 text-start"></th></tr></thead>
          <tbody>
            {categories.map((cat) => (
              <tr key={cat.id} className="border-b border-border last:border-0 hover:bg-muted-bg/30">
                <td className="px-4 py-3"><div className="font-bold text-foreground">{cat.nameFa}</div><div className="mt-1 text-xs text-muted" dir="ltr">/{cat.slug}</div></td>
                <td className="px-4 py-3 text-muted">{VERTICAL_OPTIONS.find((v) => v.value === cat.vertical)?.label ?? cat.vertical}</td>
                <td className="px-4 py-3 tabular-nums text-muted">{new Intl.NumberFormat("fa-IR").format(cat.productCount)}</td>
                <td className="px-4 py-3 text-xs font-bold">{cat.isPublished ? "منتشر شده" : "پیش‌نویس"}</td>
                <td className="px-4 py-3"><div className="flex justify-end gap-1"><Link href={`/admin/categories/${cat.id}`} className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-muted-bg"><Pencil className="h-4 w-4" /></Link><DeleteButton action={deleteCategory.bind(null, cat.id)} /></div></td>
              </tr>
            ))}
            {categories.length === 0 ? <tr><td colSpan={5} className="px-4 py-12 text-center text-muted">هنوز دسته‌بندی‌ای ثبت نشده است.</td></tr> : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
