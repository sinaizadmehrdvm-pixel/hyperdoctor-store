import { BarChart3, CreditCard, Package, Users } from "lucide-react";
import { adminRpc } from "@/lib/admin-data";

type ReportBundle = {
  summary: { orders: number; paidOrders: number; revenue: number; discounts: number; shipping: number; customers: number; products: number; lowStock: number };
  recent: Array<{ id:string; orderNumber:string; customerName:string; total:number; status:string; gateway:string; paymentRefId?:string|null; createdAt:string }>;
  daily: Array<{ dateKey:string; orderCount:number; revenue:number }>;
};

const money=(n:number)=>new Intl.NumberFormat("fa-IR").format(n);

export default async function AdminReportsPage(){
  const data=await adminRpc<ReportBundle>("admin_reports_bundle");
  const cards=[
    ["فروش تأییدشده",`${money(data.summary.revenue)} تومان`,CreditCard],
    ["سفارش‌ها",money(data.summary.orders),BarChart3],
    ["مشتریان",money(data.summary.customers),Users],
    ["کالاهای کم‌موجود",money(data.summary.lowStock),Package],
  ] as const;
  const max=Math.max(1,...data.daily.map(d=>d.revenue));
  return <div className="space-y-6">
    <div><p className="text-xs font-black uppercase tracking-[.16em] text-muted">Analytics & Finance</p><h1 className="mt-2 text-2xl font-black text-foreground">گزارش فروش و تراکنش‌ها</h1></div>
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{cards.map(([label,value,Icon])=><div key={label} className="rounded-2xl border border-border bg-card p-5 shadow-sm"><Icon className="h-5 w-5 text-primary"/><p className="mt-4 text-xs font-bold text-muted">{label}</p><p className="mt-1 text-xl font-black text-foreground">{value}</p></div>)}</div>
    <div className="rounded-2xl border border-border bg-card p-5"><div className="mb-5 flex items-center justify-between"><h2 className="font-black text-foreground">فروش ۳۰ روز اخیر</h2><span className="text-xs text-muted">تخفیف: {money(data.summary.discounts)} · ارسال: {money(data.summary.shipping)}</span></div><div className="flex h-52 items-end gap-1 overflow-x-auto">{data.daily.map(d=><div key={d.dateKey} className="group flex min-w-5 flex-1 flex-col items-center justify-end gap-2" title={`${d.dateKey} — ${money(d.revenue)}`}><div className="w-full rounded-t bg-primary/80 transition group-hover:bg-primary" style={{height:`${Math.max(4,(d.revenue/max)*180)}px`}}/><span className="hidden text-[9px] text-muted 2xl:block">{d.dateKey.slice(5)}</span></div>)}{data.daily.length===0?<div className="m-auto text-sm text-muted">هنوز فروش ثبت‌شده‌ای وجود ندارد.</div>:null}</div></div>
    <div className="overflow-x-auto rounded-2xl border border-border bg-card"><table className="w-full text-sm"><thead><tr className="border-b border-border text-xs text-muted"><th className="px-4 py-3 text-start">سفارش</th><th className="px-4 py-3 text-start">مشتری</th><th className="px-4 py-3 text-start">درگاه / مرجع</th><th className="px-4 py-3 text-start">مبلغ</th><th className="px-4 py-3 text-start">وضعیت</th><th className="px-4 py-3 text-start">تاریخ</th></tr></thead><tbody>{data.recent.map(r=><tr key={r.id} className="border-b border-border last:border-0"><td className="px-4 py-3 font-bold text-primary" dir="ltr">{r.orderNumber}</td><td className="px-4 py-3">{r.customerName}</td><td className="px-4 py-3 text-muted" dir="ltr">{r.gateway}{r.paymentRefId?` / ${r.paymentRefId}`:""}</td><td className="px-4 py-3 tabular-nums">{money(r.total)}</td><td className="px-4 py-3 text-muted">{r.status}</td><td className="px-4 py-3 text-muted">{new Date(r.createdAt).toLocaleString("fa-IR")}</td></tr>)}{data.recent.length===0?<tr><td colSpan={6} className="px-4 py-10 text-center text-muted">تراکنشی ثبت نشده است.</td></tr>:null}</tbody></table></div>
  </div>;
}
