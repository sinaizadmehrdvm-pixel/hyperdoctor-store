import Link from "next/link";
import { Plus, Pencil } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { DeleteButton } from "@/components/admin/delete-button";
import { deletePage } from "./actions";

export default async function AdminPagesPage() {
  const pages = await prisma.page.findMany({ orderBy: { navOrder: "asc" } });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">صفحات</h1>
        <Link
          href="/admin/pages/new"
          className="flex min-h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          صفحه جدید
        </Link>
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-muted">
              <th className="px-4 py-3 text-start">عنوان</th>
              <th className="px-4 py-3 text-start">اسلاگ</th>
              <th className="px-4 py-3 text-start">در منو</th>
              <th className="px-4 py-3 text-start">وضعیت</th>
              <th className="px-4 py-3 text-start"></th>
            </tr>
          </thead>
          <tbody>
            {pages.map((p) => (
              <tr key={p.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-medium text-foreground">{p.titleFa}</td>
                <td className="px-4 py-3 text-muted" dir="ltr">
                  /{p.slug}
                </td>
                <td className="px-4 py-3 text-muted">{p.showInNav ? "بله" : "خیر"}</td>
                <td className="px-4 py-3">
                  <Badge variant={p.isPublished ? "success" : "muted"}>
                    {p.isPublished ? "منتشر شده" : "پیش‌نویس"}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <Link
                      href={`/admin/pages/${p.id}`}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-muted-bg"
                    >
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                    </Link>
                    <DeleteButton action={deletePage.bind(null, p.id)} />
                  </div>
                </td>
              </tr>
            ))}
            {pages.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted">
                  هنوز صفحه‌ای ثبت نشده است.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
