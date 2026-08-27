import { CalendarCheck2, Phone, Mail, MapPin } from "lucide-react";
import { adminRpc } from "@/lib/admin-data";
import { updateBookingStatus } from "./actions";

type BookingStatus = "PENDING" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
type Booking = {
  id: string;
  requestToken: string;
  serviceId: string;
  serviceName: string;
  customerName: string;
  phone: string;
  email?: string | null;
  preferredDate: string;
  preferredTime: string;
  address?: string | null;
  notes?: string | null;
  locale: string;
  status: BookingStatus;
  createdAt: string;
};

const STATUS_LABEL: Record<BookingStatus, string> = {
  PENDING: "در انتظار بررسی",
  CONFIRMED: "تأیید شده",
  IN_PROGRESS: "در حال انجام",
  COMPLETED: "انجام شده",
  CANCELLED: "لغو شده",
};

export default async function AdminBookingsPage() {
  const bookings = await adminRpc<Booking[]>("admin_bookings_bundle");
  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div><p className="text-xs font-black uppercase tracking-[.16em] text-muted">Service Operations</p><h1 className="mt-2 text-2xl font-black text-foreground">رزرو خدمات</h1></div>
        <span className="rounded-xl border border-border bg-card px-3 py-2 text-xs font-bold text-muted">{new Intl.NumberFormat("fa-IR").format(bookings.length)} درخواست</span>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        {bookings.map((b) => {
          const action = updateBookingStatus.bind(null, b.id);
          return (
            <article key={b.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div>
                  <div className="flex items-center gap-2 text-primary"><CalendarCheck2 className="h-4 w-4" /><span className="text-xs font-black">{b.serviceName}</span></div>
                  <h2 className="mt-2 text-lg font-black text-foreground">{b.customerName}</h2>
                  <p className="mt-1 text-xs text-muted">ثبت: {new Date(b.createdAt).toLocaleString("fa-IR")}</p>
                </div>
                <form action={action} className="flex gap-2">
                  <select name="status" defaultValue={b.status} className="h-10 rounded-xl border border-border bg-background px-3 text-xs font-bold">
                    {Object.entries(STATUS_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                  <button className="h-10 rounded-xl bg-primary px-3 text-xs font-black text-white">ثبت وضعیت</button>
                </form>
              </div>

              <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
                <div className="rounded-xl bg-muted-bg p-3"><span className="text-xs text-muted">تاریخ ترجیحی</span><div className="mt-1 font-bold text-foreground">{new Date(`${b.preferredDate}T00:00:00`).toLocaleDateString("fa-IR")} — {b.preferredTime}</div></div>
                <div className="rounded-xl bg-muted-bg p-3"><span className="text-xs text-muted">زبان درخواست</span><div className="mt-1 font-bold uppercase text-foreground">{b.locale}</div></div>
              </div>

              <div className="mt-4 space-y-2 text-sm text-muted">
                <p className="flex items-center gap-2"><Phone className="h-4 w-4" /><span dir="ltr">{b.phone}</span></p>
                {b.email ? <p className="flex items-center gap-2"><Mail className="h-4 w-4" /><span dir="ltr">{b.email}</span></p> : null}
                {b.address ? <p className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0" /><span>{b.address}</span></p> : null}
                {b.notes ? <div className="mt-3 rounded-xl border border-border bg-background p-3 leading-7 text-foreground">{b.notes}</div> : null}
              </div>
            </article>
          );
        })}
        {bookings.length === 0 ? <div className="xl:col-span-2 rounded-2xl border border-dashed border-border bg-card p-12 text-center text-sm text-muted">هنوز درخواست رزروی ثبت نشده است.</div> : null}
      </div>
    </div>
  );
}
