import Link from "next/link";
import { Banknote, CircleDollarSign, CreditCard, ReceiptText, Search } from "lucide-react";
import { adminRpc } from "@/lib/admin-data";

type ReportBundle = {
  summary: { orders: number; paidOrders: number; revenue: number; discounts: number; shipping: number; customers: number; products: number; lowStock: number };
  recent: Array<{ id:string; orderNumber:string; customerName:string; total:number; status:string; gateway:string; paymentRefId?:string|null; createdAt:string }>;
  daily: Array<{ dateKey:string; orderCount:number; revenue:number }>;
};
const money=(n:number)=>new Intl.NumberFormat("fa-IR").format(n);

export default async function AdminTransactionsPage({searchParams}:{searchParams:Promise<{q?:string}>}){
  const [{q=""},data]=await Promise.all([searchParams,adminRpc<ReportBundle>("admin_reports_bundle")]);
  const rows=data.recent.filter(r=>!q||r.orderNumber.toLowerCase().includes(q.toLowerCase())||r.customerName.toLowerCase().includes(q.toLowerCase())||(r.paymentRefId||"").toLowerCase().includes(q.toLowerCase()));
  const failed=data.recent.filter(r=>r.status==="FAILED").length;
  const cards=[
    {label:"کل مبلغ موفق",value:`${money(data.summary.revenue)} تومان`,icon:CircleDollarSign,tone:"bg-[#edf4ff] text-[#002b5b]"},
    {label:"پرداخت‌های موفق",value:money(data.summary.paidOrders),icon:CreditCard,tone:"bg-emerald-50 text-emerald-700"},
    {label:"پرداخت ناموفق",value:money(failed),icon:ReceiptText,tone:"bg-red-50 text-red-700"},
    {label:"هزینه ارسال",value:`${money(data.summary.shipping)} تومان`,icon:Banknote,tone:"bg-amber-50 text-amber-700"},
  ];
  return <div className="mx-auto max-w-[1450px]">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[.18em] text-[#e80346]">Finance Operations</p><h1 className="mt-2 text-3xl font-black text-[#001736]">مدیریت تراکنش‌های مالی</h1><p className="mt-2 text-sm text-[#747780]">کنترل مرجع پرداخت، درگاه، وضعیت و مبلغ سفارش‌های واقعی</p></div><Link href="/admin/reports" className="rounded-xl border border-[#dfe4ea] bg-white px-4 py-3 text-xs font-black text-[#001736]">بازگشت به گزارش فروش</Link></div>
    <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">{cards.map(({label,value,icon:Icon,tone})=><article key={label} className="rounded-[1.5rem] border border-[#e2e6eb] bg-white p-5 shadow-sm"><span className={`flex h-11 w-11 items-center justify-center rounded-xl ${tone}`}><Icon className="h-5 w-5"/></span><p className="mt-4 text-xs font-black text-[#747780]">{label}</p><p className="mt-1 text-xl font-black tabular-nums text-[#001736]">{value}</p></article>)}</div>
    <form className="mt-6 flex gap-3 rounded-[1.5rem] border border-[#e2e6eb] bg-white p-4 shadow-sm"><label className="relative flex-1"><Search className="pointer-events-none absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9a9da5]"/><input name="q" defaultValue={q} placeholder="جستجو با شماره سفارش، نام مشتری یا مرجع پرداخت..." className="h-11 w-full rounded-xl border border-[#dfe4ea] bg-[#f7fafd] ps-11 pe-4 text-sm outline-none focus:border-[#009dd8]"/></label><button className="rounded-xl bg-[#001736] px-5 text-xs font-black text-white">جستجو</button></form>
    <section className="mt-6 overflow-hidden rounded-[1.6rem] border border-[#e2e6eb] bg-white shadow-sm"><div className="flex items-center justify-between border-b border-[#edf0f2] px-5 py-4"><div><h2 className="font-black text-[#001736]">سوابق تراکنش‌ها</h2><p className="mt-1 text-[11px] text-[#8a8e96]">{money(rows.length)} رکورد در نمای فعلی</p></div><span className="rounded-full bg-[#f1f4f7] px-3 py-1 text-[10px] font-black text-[#747780]">Real payment data</span></div><div className="overflow-x-auto"><table className="w-full min-w-[980px] text-sm"><thead className="bg-[#f7fafd] text-[11px] font-black text-[#747780]"><tr><th className="px-5 py-3 text-start">تاریخ</th><th className="px-5 py-3 text-start">سفارش</th><th className="px-5 py-3 text-start">مشتری</th><th className="px-5 py-3 text-start">درگاه</th><th className="px-5 py-3 text-start">مرجع</th><th className="px-5 py-3 text-start">مبلغ</th><th className="px-5 py-3 text-start">وضعیت</th></tr></thead><tbody className="divide-y divide-[#edf0f2]">{rows.map(r=><tr key={r.id} className="hover:bg-[#fafcff]"><td className="px-5 py-4 text-xs text-[#747780]">{new Date(r.createdAt).toLocaleString("fa-IR")}</td><td className="px-5 py-4"><Link href={`/admin/orders/${r.id}`} dir="ltr" className="font-mono text-xs font-black text-[#002b5b]">{r.orderNumber}</Link></td><td className="px-5 py-4 font-bold text-[#43474f]">{r.customerName}</td><td className="px-5 py-4 text-xs text-[#747780]" dir="ltr">{r.gateway||"—"}</td><td className="px-5 py-4 font-mono text-xs text-[#747780]" dir="ltr">{r.paymentRefId||"—"}</td><td className="px-5 py-4 font-black tabular-nums text-[#001736]">{money(r.total)}</td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${r.status==="PAID"?"bg-emerald-50 text-emerald-700":r.status==="FAILED"?"bg-red-50 text-red-700":"bg-amber-50 text-amber-700"}`}>{r.status}</span></td></tr>)}{rows.length===0?<tr><td colSpan={7} className="px-5 py-14 text-center text-[#8a8e96]">تراکنشی با این معیار پیدا نشد.</td></tr>:null}</tbody></table></div></section>
  </div>;
}
