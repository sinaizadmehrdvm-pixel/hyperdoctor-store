import Link from "next/link";
import { Plus, Pencil } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { deleteCategory } from "./actions";
import { DeleteButton } from "@/components/admin/delete-button";
import { VERTICAL_OPTIONS } from "@/lib/verticals";

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: { order: "asc" },
    include: { _count: { select: { products: true } } },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">دسته‌بندی‌ها</h1>
        <Link
          href="/admin/categories/new"
          className="flex min-h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          دسته‌بندی جدید
        </Link>
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-start text-xs text-muted">
              <th className="px-4 py-3 text-start">نام</th>
              <th className="px-4 py-3 text-start">دسته</th>
              <th className="px-4 py-3 text-start">تعداد محصول</th>
              <th className="px-4 py-3 text-start"></th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat) => (
              <tr key={cat.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-medium text-foreground">{cat.nameFa}</td>
                <td className="px-4 py-3 text-muted">
                  {VERTICAL_OPTIONS.find((v) => v.value === cat.vertical)?.label}
                </td>
                <td className="px-4 py-3 tabular-nums text-muted">{cat._count.products}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <Link
                      href={`/admin/categories/${cat.id}`}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-muted-bg"
                    >
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                    </Link>
                    <DeleteButton action={deleteCategory.bind(null, cat.id)} />
                  </div>
                </td>
              </tr>
            ))}
            {categories.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-muted">
                  هنوز دسته‌بندی‌ای ثبت نشده است.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
