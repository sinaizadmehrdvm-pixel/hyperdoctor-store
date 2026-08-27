import { Headphones, Mail, Phone, ShieldAlert, Wrench } from "lucide-react";
import { adminRpc } from "@/lib/admin-data";
import { updateSupportTicket } from "./actions";

type Ticket = {
  id: string;
  ticketNo: string;
  subject: string;
  category: string;
  status: "OPEN" | "IN_PROGRESS" | "WAITING_CUSTOMER" | "RESOLVED" | "CLOSED";
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  guestName?: string | null;
  guestPhone?: string | null;
  guestEmail?: string | null;
  deviceInfo?: string | null;
  locale: string;
  createdAt: string;
  customerName?: string | null;
  customerPhone?: string | null;
  customerEmail?: string | null;
  messages: { id: string; senderType: string; senderName: string; body: string; createdAt: string }[];
};

const STATUS = {
  OPEN: "باز",
  IN_PROGRESS: "در حال بررسی",
  WAITING_CUSTOMER: "منتظر مشتری",
  RESOLVED: "حل شده",
  CLOSED: "بسته",
} as const;
const PRIORITY = { LOW: "کم", NORMAL: "عادی", HIGH: "بالا", URGENT: "فوری" } as const;

export default async function AdminSupportPage() {
  const tickets = await adminRpc<Ticket[]>("admin_support_tickets", { p_search: "" });
  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[.16em] text-muted">Support Operations</p>
          <h1 className="mt-2 text-2xl font-black text-foreground">تیکت‌های پشتیبانی</h1>
        </div>
        <span className="rounded-xl border border-border bg-card px-3 py-2 text-xs font-bold text-muted">{new Intl.NumberFormat("fa-IR").format(tickets.length)} تیکت</span>
      </div>

      <div className="mt-6 space-y-4">
        {tickets.map((t) => {
          const name = t.customerName || t.guestName || "مشتری";
          const phone = t.customerPhone || t.guestPhone;
          const email = t.customerEmail || t.guestEmail;
          const action = updateSupportTicket.bind(null, t.id);
          return (
            <article key={t.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-start">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-lg bg-primary/10 px-2 py-1 text-xs font-black text-primary" dir="ltr">{t.ticketNo}</span>
                    <span className="rounded-lg bg-muted-bg px-2 py-1 text-xs font-bold text-muted">{PRIORITY[t.priority]}</span>
                    <span className="text-xs font-bold uppercase text-muted">{t.locale}</span>
                  </div>
                  <h2 className="mt-3 text-lg font-black text-foreground">{t.subject}</h2>
                  <p className="mt-1 text-xs text-muted">{name} · {new Date(t.createdAt).toLocaleString("fa-IR")}</p>
                </div>
                <form action={action} className="grid gap-2 sm:grid-cols-[auto_auto_auto]">
                  <select name="status" defaultValue={t.status} className="h-10 rounded-xl border border-border bg-background px-3 text-xs font-bold">
                    {Object.entries(STATUS).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                  <select name="priority" defaultValue={t.priority} className="h-10 rounded-xl border border-border bg-background px-3 text-xs font-bold">
                    {Object.entries(PRIORITY).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                  <button className="h-10 rounded-xl bg-primary px-4 text-xs font-black text-white">ثبت</button>
                  <textarea name="reply" rows={3} placeholder="پاسخ مدیر..." className="sm:col-span-3 rounded-xl border border-border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-primary/30" />
                </form>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {phone ? <div className="rounded-xl bg-muted-bg p-3 text-sm"><Phone className="mb-2 h-4 w-4 text-primary"/><span dir="ltr">{phone}</span></div> : null}
                {email ? <div className="rounded-xl bg-muted-bg p-3 text-sm"><Mail className="mb-2 h-4 w-4 text-primary"/><span dir="ltr">{email}</span></div> : null}
                <div className="rounded-xl bg-muted-bg p-3 text-sm"><Headphones className="mb-2 h-4 w-4 text-primary"/>{t.category || "GENERAL"}</div>
                {t.deviceInfo ? <div className="rounded-xl bg-muted-bg p-3 text-sm"><Wrench className="mb-2 h-4 w-4 text-primary"/>{t.deviceInfo}</div> : null}
              </div>

              {t.messages.length ? <div className="mt-4 space-y-2 rounded-2xl border border-border bg-background p-4">{t.messages.map((m) => <div key={m.id} className="rounded-xl bg-card p-3"><div className="flex items-center justify-between gap-3"><span className="text-xs font-black text-primary">{m.senderName || m.senderType}</span><span className="text-[11px] text-muted">{new Date(m.createdAt).toLocaleString("fa-IR")}</span></div><p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-foreground">{m.body}</p></div>)}</div> : <div className="mt-4 flex items-center gap-2 rounded-xl border border-dashed border-border p-4 text-sm text-muted"><ShieldAlert className="h-4 w-4"/> هنوز پیامی برای این تیکت ثبت نشده است.</div>}
            </article>
          );
        })}
        {tickets.length === 0 ? <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center text-sm text-muted">تیکتی ثبت نشده است.</div> : null}
      </div>
    </div>
  );
}
