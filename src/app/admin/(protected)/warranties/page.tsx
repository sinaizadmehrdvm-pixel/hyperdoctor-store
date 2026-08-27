import { CalendarDays, Mail, Phone, ShieldCheck } from "lucide-react";
import { adminRpc } from "@/lib/admin-data";
import { updateWarranty } from "./actions";

type Warranty = {
  id: string;
  serialNumber: string;
  orderNumber: string;
  purchaseDate?: string | null;
  startsAt: string;
  expiresAt: string;
  status: "ACTIVE" | "EXPIRED" | "SUSPENDED" | "REPLACED";
  notes: string;
  guestName?: string | null;
  guestPhone?: string | null;
  guestEmail?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  customerEmail?: string | null;
  productNameFa: string;
  productNameEn: string;
  sku: string;
  locale: string;
  createdAt: string;
};

const STATUS = { ACTIVE: "فعال", EXPIRED: "منقضی", SUSPENDED: "تعلیق", REPLACED: "تعویض شده" } as const;

export default async function AdminWarrantiesPage() {
  const items = await adminRpc<Warranty[]>("admin_warranties", { p_search: "" });
  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div><p className="text-xs font-black uppercase tracking-[.16em] text-muted">Warranty Operations</p><h1 className="mt-2 text-2xl font-black text-foreground">مدیریت گارانتی</h1></div>
        <span className="rounded-xl border border-border bg-card px-3 py-2 text-xs font-bold text-muted">{new Intl.NumberFormat("fa-IR").format(items.length)} مورد</span>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        {items.map((w) => {
          const action = updateWarranty.bind(null, w.id);
          const name = w.customerName || w.guestName || "مشتری";
          const phone = w.customerPhone || w.guestPhone;
          const email = w.customerEmail || w.guestEmail;
          return (
            <article key={w.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div>
                  <div className="flex items-center gap-2 text-primary"><ShieldCheck className="h-4 w-4"/><span className="text-xs font-black" dir="ltr">{w.serialNumber}</span><span className="text-xs font-bold uppercase text-muted">{w.locale}</span></div>
                  <h2 className="mt-2 text-lg font-black text-foreground">{w.productNameFa || w.productNameEn}</h2>
                  <p className="mt-1 text-xs text-muted">{name} · SKU: <span dir="ltr">{w.sku}</span></p>
                </div>
                <form action={action} className="grid min-w-[220px] gap-2">
                  <select name="status" defaultValue={w.status} className="h-10 rounded-xl border border-border bg-background px-3 text-xs font-bold">
                    {Object.entries(STATUS).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                  <textarea name="notes" defaultValue={w.notes} rows={2} placeholder="یادداشت داخلی گارانتی" className="rounded-xl border border-border bg-background p-3 text-sm" />
                  <button className="h-10 rounded-xl bg-primary px-3 text-xs font-black text-white">ذخیره تغییرات</button>
                </form>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <div className="rounded-xl bg-muted-bg p-3 text-sm"><CalendarDays className="mb-2 h-4 w-4 text-primary"/><span className="block text-xs text-muted">شروع</span><b>{new Date(w.startsAt).toLocaleDateString("fa-IR")}</b></div>
                <div className="rounded-xl bg-muted-bg p-3 text-sm"><CalendarDays className="mb-2 h-4 w-4 text-primary"/><span className="block text-xs text-muted">پایان</span><b>{new Date(w.expiresAt).toLocaleDateString("fa-IR")}</b></div>
                <div className="rounded-xl bg-muted-bg p-3 text-sm"><span className="block text-xs text-muted">شماره سفارش</span><b dir="ltr">{w.orderNumber || "—"}</b></div>
              </div>

              <div className="mt-4 space-y-2 text-sm text-muted">
                {phone ? <p className="flex items-center gap-2"><Phone className="h-4 w-4"/><span dir="ltr">{phone}</span></p> : null}
                {email ? <p className="flex items-center gap-2"><Mail className="h-4 w-4"/><span dir="ltr">{email}</span></p> : null}
              </div>
            </article>
          );
        })}
        {items.length === 0 ? <div className="xl:col-span-2 rounded-2xl border border-dashed border-border bg-card p-12 text-center text-sm text-muted">گارانتی ثبت‌شده‌ای وجود ندارد.</div> : null}
      </div>
    </div>
  );
}
