import { BadgePercent, TicketPercent } from "lucide-react";
import { adminRpc } from "@/lib/admin-data";
import { upsertCoupon } from "./actions";

type Coupon = {
  id: string;
  code: string;
  type: "PERCENT" | "FIXED";
  value: number;
  minOrderAmount?: number | null;
  maxDiscount?: number | null;
  usageLimit?: number | null;
  usageLimitPerUser?: number | null;
  startsAt?: string | null;
  expiresAt?: string | null;
  isActive: boolean;
  usageCount: number;
};

export default async function AdminDiscountsPage() {
  const coupons = await adminRpc<Coupon[]>("admin_coupons");
  return <div>
    <div><p className="text-xs font-black uppercase tracking-[.16em] text-muted">Promotions</p><h1 className="mt-2 text-2xl font-black text-foreground">تخفیف و کدهای تخفیف</h1></div>
    <form action={upsertCoupon} className="mt-6 grid gap-3 rounded-2xl border border-border bg-card p-5 md:grid-cols-2 xl:grid-cols-4">
      <input name="code" required placeholder="کد تخفیف" className="h-11 rounded-xl border border-border bg-background px-3 text-sm uppercase" dir="ltr" />
      <select name="type" className="h-11 rounded-xl border border-border bg-background px-3 text-sm"><option value="PERCENT">درصدی</option><option value="FIXED">مبلغ ثابت</option></select>
      <input name="value" required type="number" min="0" placeholder="مقدار" className="h-11 rounded-xl border border-border bg-background px-3 text-sm" />
      <input name="minOrderAmount" type="number" min="0" placeholder="حداقل مبلغ سفارش" className="h-11 rounded-xl border border-border bg-background px-3 text-sm" />
      <input name="maxDiscount" type="number" min="0" placeholder="حداکثر تخفیف" className="h-11 rounded-xl border border-border bg-background px-3 text-sm" />
      <input name="usageLimit" type="number" min="1" placeholder="سقف کل استفاده" className="h-11 rounded-xl border border-border bg-background px-3 text-sm" />
      <input name="usageLimitPerUser" type="number" min="1" placeholder="سقف هر کاربر" className="h-11 rounded-xl border border-border bg-background px-3 text-sm" />
      <label className="flex h-11 items-center gap-2 rounded-xl border border-border bg-background px-3 text-sm"><input type="checkbox" name="isActive" defaultChecked /> فعال</label>
      <input name="startsAt" type="datetime-local" className="h-11 rounded-xl border border-border bg-background px-3 text-sm" />
      <input name="expiresAt" type="datetime-local" className="h-11 rounded-xl border border-border bg-background px-3 text-sm" />
      <button className="h-11 rounded-xl bg-primary px-5 text-sm font-black text-white md:col-span-2">ایجاد کد تخفیف</button>
    </form>

    <div className="mt-6 grid gap-4 xl:grid-cols-2">
      {coupons.map(c => <article key={c.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4"><div><div className="flex items-center gap-2 text-primary"><TicketPercent className="h-4 w-4"/><span className="font-black" dir="ltr">{c.code}</span></div><div className="mt-3 text-2xl font-black text-foreground">{c.type === "PERCENT" ? `${new Intl.NumberFormat("fa-IR").format(c.value)}٪` : `${new Intl.NumberFormat("fa-IR").format(c.value)} تومان`}</div></div><span className={`rounded-lg px-2 py-1 text-xs font-black ${c.isActive?"bg-emerald-50 text-emerald-700":"bg-muted-bg text-muted"}`}>{c.isActive?"فعال":"غیرفعال"}</span></div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3 text-sm"><div className="rounded-xl bg-muted-bg p-3"><span className="block text-xs text-muted">استفاده</span><b>{new Intl.NumberFormat("fa-IR").format(c.usageCount)}{c.usageLimit ? ` / ${new Intl.NumberFormat("fa-IR").format(c.usageLimit)}` : ""}</b></div><div className="rounded-xl bg-muted-bg p-3"><span className="block text-xs text-muted">حداقل سفارش</span><b>{c.minOrderAmount ? `${new Intl.NumberFormat("fa-IR").format(c.minOrderAmount)} تومان` : "—"}</b></div><div className="rounded-xl bg-muted-bg p-3"><span className="block text-xs text-muted">حداکثر تخفیف</span><b>{c.maxDiscount ? `${new Intl.NumberFormat("fa-IR").format(c.maxDiscount)} تومان` : "—"}</b></div></div>
        <div className="mt-4 text-xs text-muted">{c.startsAt ? `شروع: ${new Date(c.startsAt).toLocaleString("fa-IR")}` : "شروع بدون محدودیت"} · {c.expiresAt ? `پایان: ${new Date(c.expiresAt).toLocaleString("fa-IR")}` : "بدون تاریخ انقضا"}</div>
      </article>)}
      {coupons.length===0?<div className="xl:col-span-2 rounded-2xl border border-dashed border-border bg-card p-12 text-center text-sm text-muted"><BadgePercent className="mx-auto mb-3 h-6 w-6"/>هنوز کد تخفیفی ساخته نشده است.</div>:null}
    </div>
  </div>;
}
