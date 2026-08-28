import { notFound } from "next/navigation";
import { ORDER_STATUS_LABELS } from "@/lib/order-status";
import { adminRpc } from "@/lib/admin-data";
import { updateOrderStatus } from "../actions";

const STATUS_ORDER = [
  "PENDING_PAYMENT",
  "PAYMENT_REVIEW",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "COMPLETED",
  "FAILED",
  "CANCELLED",
  "REFUNDED",
] as const;

type OrderStatus = (typeof STATUS_ORDER)[number];

const NEXT_STATUSES: Record<OrderStatus, readonly OrderStatus[]> = {
  PENDING_PAYMENT: ["PENDING_PAYMENT", "FAILED", "CANCELLED"],
  PAYMENT_REVIEW: ["PAYMENT_REVIEW"],
  PAID: ["PAID", "PROCESSING"],
  PROCESSING: ["PROCESSING", "SHIPPED"],
  SHIPPED: ["SHIPPED", "COMPLETED"],
  COMPLETED: ["COMPLETED"],
  FAILED: ["FAILED"],
  CANCELLED: ["CANCELLED"],
  REFUNDED: ["REFUNDED"],
};

type OrderItem = {
  id: string;
  productId?: string | null;
  serviceId?: string | null;
  nameSnapshot: string;
  priceSnapshot: number;
  quantity: number;
  preferredDate?: string | null;
};

type AdminOrderDetail = {
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  email?: string | null;
  address: string;
  province?: string | null;
  city: string;
  country?: string | null;
  postalCode?: string | null;
  notes?: string | null;
  locale: string;
  currency: string;
  subtotal: number;
  shippingFee: number;
  total: number;
  status: OrderStatus;
  gateway: string;
  paymentAuthority?: string | null;
  paymentRefId?: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
};

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await adminRpc<AdminOrderDetail | null>("admin_order_detail", { p_id: id });
  if (!order || !STATUS_ORDER.includes(order.status)) notFound();

  const boundUpdate = updateOrderStatus.bind(null, order.id);
  const nextStatuses = NEXT_STATUSES[order.status];
  const canUpdate = nextStatuses.length > 1;

  return (
    <div className="max-w-5xl">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-black uppercase tracking-[.16em] text-muted">Order Detail</p>
          <h1 className="mt-2 text-2xl font-black text-foreground" dir="ltr">{order.orderNumber}</h1>
          {order.status === "PAYMENT_REVIEW" ? (
            <p className="mt-2 max-w-2xl rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-bold text-amber-900">
              پرداخت تأیید شده اما سفارش به‌دلیل تعارض موجودی نیازمند بررسی اختصاصی است. وضعیت این سفارش با تغییر عادی قابل عبور نیست.
            </p>
          ) : null}
        </div>
        <form action={boundUpdate} className="flex items-center gap-2">
          <select name="status" defaultValue={order.status} disabled={!canUpdate} className="h-11 cursor-pointer rounded-xl border border-border bg-card px-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-70">
            {nextStatuses.map((s) => <option key={s} value={s}>{ORDER_STATUS_LABELS[s]}</option>)}
          </select>
          {canUpdate ? <button type="submit" className="min-h-11 cursor-pointer rounded-xl bg-primary px-4 text-sm font-black text-white hover:bg-primary/90">به‌روزرسانی وضعیت</button> : null}
        </form>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-black text-foreground">اطلاعات مشتری و ارسال</h2>
          <dl className="space-y-2.5 text-sm">
            <Row label="نام" value={order.customerName} />
            <Row label="تلفن" value={order.phone} dir="ltr" />
            <Row label="ایمیل" value={order.email || "—"} dir="ltr" />
            <Row label="استان" value={order.province || "—"} />
            <Row label="شهر" value={order.city} />
            <Row label="کشور" value={order.country || "—"} />
            <Row label="آدرس" value={order.address} />
            <Row label="کد پستی" value={order.postalCode || "—"} dir="ltr" />
            {order.notes ? <Row label="توضیحات" value={order.notes} /> : null}
          </dl>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-black text-foreground">پرداخت و جمع‌بندی</h2>
          <dl className="space-y-2.5 text-sm">
            <Row label="وضعیت" value={ORDER_STATUS_LABELS[order.status] || order.status} />
            <Row label="درگاه" value={order.gateway} dir="ltr" />
            <Row label="Authority" value={order.paymentAuthority || "—"} dir="ltr" />
            <Row label="کد مرجع" value={order.paymentRefId || "—"} dir="ltr" />
            <Row label="جمع جزء" value={`${new Intl.NumberFormat("fa-IR").format(order.subtotal)} تومان`} />
            <Row label="هزینه ارسال" value={`${new Intl.NumberFormat("fa-IR").format(order.shippingFee)} تومان`} />
            <Row label="مبلغ کل" value={`${new Intl.NumberFormat("fa-IR").format(order.total)} تومان`} />
            <Row label="تاریخ ثبت" value={new Date(order.createdAt).toLocaleString("fa-IR")} />
          </dl>
        </section>
      </div>

      <section className="mt-6 overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
        <h2 className="border-b border-border p-5 text-sm font-black text-foreground">اقلام سفارش</h2>
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border bg-muted-bg/50 text-xs text-muted"><th className="px-5 py-3 text-start">شرح</th><th className="px-5 py-3 text-start">تعداد</th><th className="px-5 py-3 text-start">قیمت واحد</th><th className="px-5 py-3 text-start">جمع</th></tr></thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id} className="border-b border-border last:border-0">
                <td className="px-5 py-3 font-bold text-foreground">{item.nameSnapshot}{item.preferredDate ? <div className="mt-1 text-xs font-normal text-muted">تاریخ ترجیحی: {new Date(item.preferredDate).toLocaleDateString("fa-IR")}</div> : null}</td>
                <td className="px-5 py-3 tabular-nums text-muted">{new Intl.NumberFormat("fa-IR").format(item.quantity)}</td>
                <td className="px-5 py-3 tabular-nums text-muted">{new Intl.NumberFormat("fa-IR").format(item.priceSnapshot)} تومان</td>
                <td className="px-5 py-3 tabular-nums font-bold text-foreground">{new Intl.NumberFormat("fa-IR").format(item.priceSnapshot * item.quantity)} تومان</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function Row({ label, value, dir }: { label: string; value: string; dir?: "ltr" | "rtl" }) {
  return <div className="flex justify-between gap-4 border-b border-border/60 pb-2 last:border-0"><dt className="text-muted">{label}</dt><dd className="max-w-[65%] break-words text-end font-bold text-foreground" dir={dir}>{value}</dd></div>;
}
