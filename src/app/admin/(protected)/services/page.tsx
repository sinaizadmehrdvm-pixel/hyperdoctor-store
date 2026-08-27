import Link from "next/link";
import { Plus, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DeleteButton } from "@/components/admin/delete-button";
import { adminRpc } from "@/lib/admin-data";
import { deleteService } from "./actions";

type AdminService = {
  id: string;
  slug: string;
  nameFa: string;
  nameTr: string;
  nameEn: string;
  nameAr: string;
  price?: number | null;
  priceIsFrom: boolean;
  durationMinutes?: number | null;
  requiresBooking: boolean;
  isPublished: boolean;
  bookingCount: number;
};

export default async function AdminServicesPage() {
  const services = await adminRpc<AdminService[]>("admin_services_bundle");

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div><p className="text-xs font-black uppercase tracking-[.16em] text-muted">Clinical Services</p><h1 className="mt-2 text-2xl font-black text-foreground">خدمات</h1></div>
        <Link href="/admin/services/new" className="flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-black text-white hover:bg-primary/90"><Plus className="h-4 w-4" />خدمت جدید</Link>
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border bg-muted-bg/50 text-xs text-muted"><th className="px-4 py-3 text-start">خدمت</th><th className="px-4 py-3 text-start">قیمت</th><th className="px-4 py-3 text-start">رزروها</th><th className="px-4 py-3 text-start">وضعیت</th><th className="px-4 py-3 text-start"></th></tr></thead>
          <tbody>
            {services.map((s) => (
              <tr key={s.id} className="border-b border-border last:border-0 hover:bg-muted-bg/30">
                <td className="px-4 py-3"><div className="font-bold text-foreground">{s.nameFa}</div><div className="mt-1 text-xs text-muted" dir="ltr">/{s.slug}</div></td>
                <td className="px-4 py-3 tabular-nums text-muted">{s.price ? `${s.priceIsFrom ? "از " : ""}${new Intl.NumberFormat("fa-IR").format(s.price)} تومان` : "نیاز به استعلام"}</td>
                <td className="px-4 py-3 tabular-nums text-muted">{new Intl.NumberFormat("fa-IR").format(s.bookingCount)}</td>
                <td className="px-4 py-3"><Badge variant={s.isPublished ? "success" : "muted"}>{s.isPublished ? "منتشر شده" : "پیش‌نویس"}</Badge></td>
                <td className="px-4 py-3"><div className="flex justify-end gap-1"><Link href={`/admin/services/${s.id}`} className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-muted-bg"><Pencil className="h-4 w-4" /></Link><DeleteButton action={deleteService.bind(null, s.id)} /></div></td>
              </tr>
            ))}
            {services.length === 0 ? <tr><td colSpan={5} className="px-4 py-12 text-center text-muted">هنوز خدمتی ثبت نشده است.</td></tr> : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
