import Link from "next/link";
import {
  AlertTriangle,
  CalendarClock,
  Headphones,
  Package,
  ReceiptText,
  ShieldCheck,
  ShoppingBag,
  Stethoscope,
  WalletCards,
} from "lucide-react";
import { adminRpc } from "@/lib/admin-data";
import { formatPrice } from "@/lib/utils";

type DashboardData = {
  stats: {
    products: number;
    publishedProducts: number;
    services: number;
    orders: number;
    paidOrders: number;
    revenue: number;
    openTickets: number;
    pendingBookings: number;
    activeWarranties: number;
    newContacts: number;
  };
  recentOrders: Array<{ id: string; orderNumber: string; customerName: string; total: number; status: string; createdAt: string }>;
  lowStock: Array<{ id: string; nameFa: string; nameEn: string; stock: number; sku: string }>;
  recentTickets: Array<{ id: string; ticketNo: string; subject: string; priority: string; status: string; guestName?: string | null; createdAt: string }>;
};

const statusFa: Record<string, string> = {
  PENDING_PAYMENT: "در انتظار پرداخت",
  PAID: "پرداخت‌شده",
  PROCESSING: "در حال پردازش",
  SHIPPED: "ارسال‌شده",
  COMPLETED: "تکمیل‌شده",
  CANCELLED: "لغوشده",
  FAILED: "ناموفق",
};

export default async function AdminDashboardPage() {
  const data = await adminRpc<DashboardData>("admin_dashboard");
  const s = data.stats;
  const stats = [
    { label: "محصولات منتشرشده", value: s.publishedProducts, sub: `${s.products} کل محصول`, icon: Package, href: "/admin/products" },
    { label: "خدمات فعال", value: s.services, sub: `${s.pendingBookings} رزرو در انتظار`, icon: Stethoscope, href: "/admin/services" },
    { label: "سفارش‌ها", value: s.orders, sub: `${s.paidOrders} پرداخت‌شده`, icon: ShoppingBag, href: "/admin/orders" },
    { label: "فروش تأییدشده", value: formatPrice(s.revenue, "fa"), sub: "تومان", icon: WalletCards, href: "/admin/orders" },
    { label: "تیکت‌های باز", value: s.openTickets, sub: "نیازمند پیگیری", icon: Headphones, href: "/admin/support" },
    { label: "گارانتی فعال", value: s.activeWarranties, sub: `${s.newContacts} پیام جدید`, icon: ShieldCheck, href: "/admin/warranty" },
  ];

  return (
    <div className="mx-auto max-w-[1500px]">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-xs font-black uppercase tracking-[.18em] text-[#009dd8]">VITALIS MEDTECH CONTROL CENTER</p><h1 className="mt-2 text-3xl font-black text-[#001736]">داشبورد مدیریت</h1><p className="mt-2 text-sm text-[#747780]">نمای زنده فروشگاه، خدمات، پشتیبانی و خدمات پس از فروش</p></div>
        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-700">Data API · Connected</span>
      </div>

      <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {stats.map(({ label, value, sub, icon: Icon, href }) => (
          <Link key={label} href={href} className="group rounded-3xl border border-[#dfe4ea] bg-white p-5 shadow-[0_12px_32px_rgba(0,23,54,.04)] transition hover:-translate-y-1 hover:shadow-[0_20px_45px_rgba(0,23,54,.08)]">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#d6e3ff] text-[#002b5b] transition group-hover:bg-[#001736] group-hover:text-white"><Icon className="h-5 w-5" /></span>
            <p className="mt-5 text-2xl font-black tabular-nums text-[#001736]">{value}</p><p className="mt-1 text-xs font-black text-[#43474f]">{label}</p><p className="mt-1 text-[11px] text-[#8a8e96]">{sub}</p>
          </Link>
        ))}
      </div>

      <div className="mt-7 grid gap-6 xl:grid-cols-[1.05fr_.95fr]">
        <section className="overflow-hidden rounded-3xl border border-[#dfe4ea] bg-white shadow-[0_14px_38px_rgba(0,23,54,.045)]">
          <div className="flex items-center justify-between border-b border-[#e0e3e6] px-6 py-5"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#001736] text-white"><ReceiptText className="h-5 w-5" /></span><div><h2 className="text-base font-black text-[#001736]">سفارش‌های اخیر</h2><p className="mt-0.5 text-[11px] text-[#747780]">آخرین تراکنش‌های ثبت‌شده</p></div></div><Link href="/admin/orders" className="text-xs font-black text-[#ba0036]">مشاهده همه</Link></div>
          <div className="overflow-x-auto"><table className="w-full min-w-[650px] text-sm"><thead className="bg-[#f7fafd] text-[11px] font-black text-[#747780]"><tr><th className="px-5 py-3 text-start">سفارش</th><th className="px-5 py-3 text-start">مشتری</th><th className="px-5 py-3 text-start">مبلغ</th><th className="px-5 py-3 text-start">وضعیت</th></tr></thead><tbody className="divide-y divide-[#edf0f2]">{data.recentOrders.map((o)=><tr key={o.id} className="hover:bg-[#fafcff]"><td className="px-5 py-4"><Link href={`/admin/orders/${o.id}`} dir="ltr" className="font-mono text-xs font-black text-[#002b5b]">{o.orderNumber}</Link></td><td className="px-5 py-4 font-bold text-[#43474f]">{o.customerName}</td><td className="px-5 py-4 font-black tabular-nums text-[#001736]">{formatPrice(o.total,"fa")}</td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${o.status==="PAID"?"bg-emerald-50 text-emerald-700":o.status==="FAILED"?"bg-red-50 text-red-700":"bg-amber-50 text-amber-700"}`}>{statusFa[o.status]||o.status}</span></td></tr>)}{data.recentOrders.length===0?<tr><td colSpan={4} className="px-5 py-10 text-center text-sm text-[#8a8e96]">هنوز سفارشی ثبت نشده است.</td></tr>:null}</tbody></table></div>
        </section>

        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
          <section className="rounded-3xl border border-[#dfe4ea] bg-white p-5 shadow-[0_14px_38px_rgba(0,23,54,.045)]"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ffdada] text-[#ba0036]"><AlertTriangle className="h-5 w-5" /></span><div><h2 className="text-base font-black text-[#001736]">هشدار موجودی</h2><p className="text-[11px] text-[#747780]">۵ عدد یا کمتر</p></div></div><div className="mt-5 space-y-3">{data.lowStock.map((p)=><Link key={p.id} href={`/admin/products/${p.id}`} className="flex items-center justify-between gap-3 rounded-2xl border border-[#edf0f2] bg-[#fafcff] p-3"><div className="min-w-0"><p className="truncate text-xs font-black text-[#001736]">{p.nameFa}</p><p dir="ltr" className="mt-1 text-[10px] text-[#8a8e96]">{p.sku}</p></div><span className="shrink-0 rounded-full bg-red-50 px-2 py-1 text-xs font-black text-red-700">{p.stock}</span></Link>)}{data.lowStock.length===0?<div className="rounded-2xl bg-emerald-50 p-4 text-center text-xs font-black text-emerald-700">هشدار موجودی نداریم.</div>:null}</div></section>

          <section className="rounded-3xl border border-[#dfe4ea] bg-white p-5 shadow-[0_14px_38px_rgba(0,23,54,.045)]"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#d6e3ff] text-[#002b5b]"><CalendarClock className="h-5 w-5" /></span><div><h2 className="text-base font-black text-[#001736]">پشتیبانی اخیر</h2><p className="text-[11px] text-[#747780]">تیکت‌های جدید</p></div></div><div className="mt-5 space-y-3">{data.recentTickets.map((ticket)=><Link key={ticket.id} href={`/admin/support/${ticket.id}`} className="block rounded-2xl border border-[#edf0f2] bg-[#fafcff] p-3"><div className="flex items-center justify-between gap-3"><span dir="ltr" className="font-mono text-[10px] font-black text-[#ba0036]">{ticket.ticketNo}</span><span className="text-[10px] font-black text-[#747780]">{ticket.priority}</span></div><p className="mt-2 line-clamp-1 text-xs font-black text-[#001736]">{ticket.subject}</p></Link>)}{data.recentTickets.length===0?<div className="rounded-2xl bg-[#f7fafd] p-4 text-center text-xs font-bold text-[#747780]">تیکت جدیدی وجود ندارد.</div>:null}</div></section>
        </div>
      </div>
    </div>
  );
}
