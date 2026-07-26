import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ORDER_STATUS_LABELS } from "@/lib/order-status";
import { updateOrderStatus } from "../actions";

const STATUS_ORDER = [
  "PENDING_PAYMENT",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "COMPLETED",
  "FAILED",
  "CANCELLED",
];

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await prisma.order.findUnique({ where: { id }, include: { items: true } });
  if (!order) notFound();

  const boundUpdate = updateOrderStatus.bind(null, order.id);

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground" dir="ltr">
          {order.orderNumber}
        </h1>
        <form action={boundUpdate} className="flex items-center gap-2">
          <select
            name="status"
            defaultValue={order.status}
            className="h-10 cursor-pointer rounded-lg border border-border bg-card px-3 text-sm"
          >
            {STATUS_ORDER.map((s) => (
              <option key={s} value={s}>
                {ORDER_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="min-h-10 cursor-pointer rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-primary/90"
          >
            به‌روزرسانی وضعیت
          </button>
        </form>
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-3 text-sm font-semibold text-foreground">اطلاعات مشتری</h2>
          <dl className="space-y-2 text-sm">
            <Row label="نام" value={order.customerName} />
            <Row label="تلفن" value={order.phone} dir="ltr" />
            <Row label="ایمیل" value={order.email || "—"} dir="ltr" />
            <Row label="شهر" value={order.city} />
            <Row label="آدرس" value={order.address} />
            <Row label="کد پستی" value={order.postalCode || "—"} dir="ltr" />
            {order.notes ? <Row label="توضیحات" value={order.notes} /> : null}
          </dl>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-3 text-sm font-semibold text-foreground">اطلاعات پرداخت</h2>
          <dl className="space-y-2 text-sm">
            <Row label="درگاه" value={order.gateway} dir="ltr" />
            <Row label="کد پیگیری" value={order.paymentRefId || "—"} dir="ltr" />
            <Row label="جمع جزء" value={`${new Intl.NumberFormat("fa-IR").format(order.subtotal)} تومان`} />
            <Row label="هزینه ارسال" value={`${new Intl.NumberFormat("fa-IR").format(order.shippingFee)} تومان`} />
            <Row label="مبلغ کل" value={`${new Intl.NumberFormat("fa-IR").format(order.total)} تومان`} />
          </dl>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-card">
        <h2 className="border-b border-border p-5 text-sm font-semibold text-foreground">اقلام سفارش</h2>
        <table className="w-full text-sm">
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id} className="border-b border-border last:border-0">
                <td className="px-5 py-3 text-foreground">{item.nameSnapshot}</td>
                <td className="px-5 py-3 tabular-nums text-muted">× {item.quantity}</td>
                <td className="px-5 py-3 tabular-nums text-muted">
                  {new Intl.NumberFormat("fa-IR").format(item.priceSnapshot)} تومان
                </td>
                {item.preferredDate ? (
                  <td className="px-5 py-3 text-muted tabular-nums">
                    {new Date(item.preferredDate).toLocaleDateString("fa-IR")}
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Row({ label, value, dir }: { label: string; value: string; dir?: "ltr" | "rtl" }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted">{label}</dt>
      <dd className="font-medium text-foreground text-end" dir={dir}>
        {value}
      </dd>
    </div>
  );
}
