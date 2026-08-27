import { Mail, Phone, UserRound, WalletCards } from "lucide-react";
import { adminRpc } from "@/lib/admin-data";
import { updateCustomer } from "./actions";

type Customer = {
  id: string;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  locale: string;
  isActive: boolean;
  marketingConsent: boolean;
  createdAt: string;
  orderCount: number;
  lifetimeValue: number;
};

export default async function AdminCustomersPage() {
  const customers = await adminRpc<Customer[]>("admin_customers", { p_search: "" });
  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div><p className="text-xs font-black uppercase tracking-[.16em] text-muted">CRM</p><h1 className="mt-2 text-2xl font-black text-foreground">مشتریان</h1></div>
        <span className="rounded-xl border border-border bg-card px-3 py-2 text-xs font-bold text-muted">{new Intl.NumberFormat("fa-IR").format(customers.length)} مشتری</span>
      </div>
      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        {customers.map((c) => {
          const action = updateCustomer.bind(null, c.id);
          return <article key={c.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div>
                <div className="flex items-center gap-2 text-primary"><UserRound className="h-4 w-4"/><span className="text-xs font-black uppercase">{c.locale}</span></div>
                <h2 className="mt-2 text-lg font-black text-foreground">{c.fullName || "بدون نام"}</h2>
                <p className="mt-1 text-xs text-muted">عضویت: {new Date(c.createdAt).toLocaleDateString("fa-IR")}</p>
              </div>
              <form action={action} className="space-y-2 rounded-xl border border-border bg-background p-3 text-xs">
                <label className="flex items-center gap-2"><input type="checkbox" name="isActive" defaultChecked={c.isActive}/> حساب فعال</label>
                <label className="flex items-center gap-2"><input type="checkbox" name="marketingConsent" defaultChecked={c.marketingConsent}/> رضایت بازاریابی</label>
                <button className="h-9 w-full rounded-lg bg-primary px-3 font-black text-white">ذخیره</button>
              </form>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-muted-bg p-3"><span className="text-xs text-muted">تعداد سفارش</span><div className="mt-1 text-lg font-black text-foreground">{new Intl.NumberFormat("fa-IR").format(c.orderCount)}</div></div>
              <div className="rounded-xl bg-muted-bg p-3"><span className="text-xs text-muted">ارزش خرید</span><div className="mt-1 flex items-center gap-2 text-lg font-black text-foreground"><WalletCards className="h-4 w-4 text-primary"/>{new Intl.NumberFormat("fa-IR").format(c.lifetimeValue)} تومان</div></div>
            </div>
            <div className="mt-4 space-y-2 text-sm text-muted">
              {c.phone ? <p className="flex items-center gap-2"><Phone className="h-4 w-4"/><span dir="ltr">{c.phone}</span></p> : null}
              {c.email ? <p className="flex items-center gap-2"><Mail className="h-4 w-4"/><span dir="ltr">{c.email}</span></p> : null}
            </div>
          </article>;
        })}
        {customers.length === 0 ? <div className="xl:col-span-2 rounded-2xl border border-dashed border-border bg-card p-12 text-center text-sm text-muted">هنوز مشتری ثبت‌شده‌ای وجود ندارد.</div> : null}
      </div>
    </div>
  );
}
