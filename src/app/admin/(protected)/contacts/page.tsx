import { Mail, MessageSquareText, Phone } from "lucide-react";
import { adminRpc } from "@/lib/admin-data";
import { updateContactStatus } from "./actions";

type Contact = {
  id: string;
  customerName: string;
  phone: string;
  email?: string | null;
  department: string;
  message: string;
  locale: string;
  status: "NEW" | "IN_PROGRESS" | "REPLIED" | "CLOSED";
  createdAt: string;
};

const STATUS = { NEW: "جدید", IN_PROGRESS: "در حال پیگیری", REPLIED: "پاسخ داده شده", CLOSED: "بسته" } as const;

export default async function AdminContactsPage() {
  const contacts = await adminRpc<Contact[]>("admin_contact_messages", { p_search: "" });
  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div><p className="text-xs font-black uppercase tracking-[.16em] text-muted">Contact Inbox</p><h1 className="mt-2 text-2xl font-black text-foreground">پیام‌های تماس</h1></div>
        <span className="rounded-xl border border-border bg-card px-3 py-2 text-xs font-bold text-muted">{new Intl.NumberFormat("fa-IR").format(contacts.length)} پیام</span>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        {contacts.map((c) => {
          const action = updateContactStatus.bind(null, c.id);
          return (
            <article key={c.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div>
                  <div className="flex items-center gap-2 text-primary"><MessageSquareText className="h-4 w-4"/><span className="text-xs font-black">{c.department}</span><span className="text-xs font-bold uppercase text-muted">{c.locale}</span></div>
                  <h2 className="mt-2 text-lg font-black text-foreground">{c.customerName}</h2>
                  <p className="mt-1 text-xs text-muted">{new Date(c.createdAt).toLocaleString("fa-IR")}</p>
                </div>
                <form action={action} className="flex gap-2">
                  <select name="status" defaultValue={c.status} className="h-10 rounded-xl border border-border bg-background px-3 text-xs font-bold">
                    {Object.entries(STATUS).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                  <button className="h-10 rounded-xl bg-primary px-3 text-xs font-black text-white">ثبت وضعیت</button>
                </form>
              </div>

              <div className="mt-4 space-y-2 text-sm text-muted">
                <p className="flex items-center gap-2"><Phone className="h-4 w-4"/><span dir="ltr">{c.phone}</span></p>
                {c.email ? <p className="flex items-center gap-2"><Mail className="h-4 w-4"/><span dir="ltr">{c.email}</span></p> : null}
              </div>
              <div className="mt-4 rounded-xl border border-border bg-background p-4 text-sm leading-7 text-foreground whitespace-pre-wrap">{c.message}</div>
            </article>
          );
        })}
        {contacts.length === 0 ? <div className="xl:col-span-2 rounded-2xl border border-dashed border-border bg-card p-12 text-center text-sm text-muted">پیامی ثبت نشده است.</div> : null}
      </div>
    </div>
  );
}
