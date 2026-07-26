import Link from "next/link";
import { Plus, Pencil } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { DeleteButton } from "@/components/admin/delete-button";
import { deleteService } from "./actions";

export default async function AdminServicesPage() {
  const services = await prisma.service.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">خدمات</h1>
        <Link
          href="/admin/services/new"
          className="flex min-h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          خدمت جدید
        </Link>
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-muted">
              <th className="px-4 py-3 text-start">نام</th>
              <th className="px-4 py-3 text-start">قیمت</th>
              <th className="px-4 py-3 text-start">رزرو</th>
              <th className="px-4 py-3 text-start">وضعیت</th>
              <th className="px-4 py-3 text-start"></th>
            </tr>
          </thead>
          <tbody>
            {services.map((s) => (
              <tr key={s.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-medium text-foreground">{s.nameFa}</td>
                <td className="px-4 py-3 tabular-nums text-muted">
                  {s.price ? new Intl.NumberFormat("fa-IR").format(s.price) : "—"}
                </td>
                <td className="px-4 py-3 text-muted">{s.requiresBooking ? "بله" : "خیر"}</td>
                <td className="px-4 py-3">
                  <Badge variant={s.isPublished ? "success" : "muted"}>
                    {s.isPublished ? "منتشر شده" : "پیش‌نویس"}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <Link
                      href={`/admin/services/${s.id}`}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-muted-bg"
                    >
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                    </Link>
                    <DeleteButton action={deleteService.bind(null, s.id)} />
                  </div>
                </td>
              </tr>
            ))}
            {services.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted">
                  هنوز خدمتی ثبت نشده است.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
