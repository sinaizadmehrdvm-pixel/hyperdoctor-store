import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { ORDER_STATUS_LABELS, ORDER_STATUS_BADGE } from "@/lib/order-status";

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { items: true } } },
  });

  return (
    <div>
      <h1 className="text-xl font-bold text-foreground">سفارش‌ها</h1>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-muted">
              <th className="px-4 py-3 text-start">شماره سفارش</th>
              <th className="px-4 py-3 text-start">مشتری</th>
              <th className="px-4 py-3 text-start">مبلغ</th>
              <th className="px-4 py-3 text-start">وضعیت</th>
              <th className="px-4 py-3 text-start">تاریخ</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3">
                  <Link href={`/admin/orders/${o.id}`} className="font-medium text-primary hover:underline" dir="ltr">
                    {o.orderNumber}
                  </Link>
                </td>
                <td className="px-4 py-3 text-foreground">{o.customerName}</td>
                <td className="px-4 py-3 tabular-nums text-muted">
                  {new Intl.NumberFormat("fa-IR").format(o.total)}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={ORDER_STATUS_BADGE[o.status]}>
                    {ORDER_STATUS_LABELS[o.status]}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-muted tabular-nums">
                  {new Date(o.createdAt).toLocaleDateString("fa-IR")}
                </td>
              </tr>
            ))}
            {orders.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted">
                  هنوز سفارشی ثبت نشده است.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
