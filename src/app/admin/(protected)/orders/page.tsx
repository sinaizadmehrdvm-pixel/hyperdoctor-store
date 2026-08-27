import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ORDER_STATUS_LABELS, ORDER_STATUS_BADGE } from "@/lib/order-status";
import { adminRpc } from "@/lib/admin-data";

type OrderStatus = keyof typeof ORDER_STATUS_LABELS;
type AdminOrder = {
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  email?: string | null;
  total: number;
  currency: string;
  status: OrderStatus;
  createdAt: string;
  itemCount: number;
};

export default async function AdminOrdersPage() {
  const orders = await adminRpc<AdminOrder[]>("admin_orders_bundle");

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[.16em] text-muted">Sales & Fulfillment</p>
          <h1 className="mt-2 text-2xl font-black text-foreground">سفارش‌ها</h1>
        </div>
        <span className="rounded-xl border border-border bg-card px-3 py-2 text-xs font-bold text-muted">
          {new Intl.NumberFormat("fa-IR").format(orders.length)} سفارش
        </span>
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted-bg/50 text-xs text-muted">
              <th className="px-4 py-3 text-start">شماره سفارش</th>
              <th className="px-4 py-3 text-start">مشتری</th>
              <th className="px-4 py-3 text-start">اقلام</th>
              <th className="px-4 py-3 text-start">مبلغ</th>
              <th className="px-4 py-3 text-start">وضعیت</th>
              <th className="px-4 py-3 text-start">تاریخ</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-b border-border last:border-0 hover:bg-muted-bg/30">
                <td className="px-4 py-3">
                  <Link href={`/admin/orders/${o.id}`} className="font-black text-primary hover:underline" dir="ltr">
                    {o.orderNumber}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <div className="font-bold text-foreground">{o.customerName}</div>
                  <div className="mt-1 text-xs text-muted" dir="ltr">{o.phone}</div>
                </td>
                <td className="px-4 py-3 tabular-nums text-muted">{new Intl.NumberFormat("fa-IR").format(o.itemCount)}</td>
                <td className="px-4 py-3 tabular-nums font-bold text-foreground">
                  {new Intl.NumberFormat("fa-IR").format(o.total)} تومان
                </td>
                <td className="px-4 py-3">
                  <Badge variant={ORDER_STATUS_BADGE[o.status]}>{ORDER_STATUS_LABELS[o.status]}</Badge>
                </td>
                <td className="px-4 py-3 text-muted tabular-nums">
                  {new Date(o.createdAt).toLocaleDateString("fa-IR")}
                </td>
              </tr>
            ))}
            {orders.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-muted">هنوز سفارشی ثبت نشده است.</td></tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
