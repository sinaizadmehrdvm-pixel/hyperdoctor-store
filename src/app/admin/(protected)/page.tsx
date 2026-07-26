import Link from "next/link";
import { AlertTriangle, Package, ShoppingBag, Stethoscope } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { ORDER_STATUS_LABELS, ORDER_STATUS_BADGE } from "@/lib/order-status";

const LOW_STOCK_THRESHOLD = 5;

export default async function AdminDashboardPage() {
  const [productCount, serviceCount, orderCount, recentOrders, lowStockProducts] =
    await Promise.all([
      prisma.product.count(),
      prisma.service.count(),
      prisma.order.count(),
      prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 6 }),
      prisma.product.findMany({
        where: { stock: { lte: LOW_STOCK_THRESHOLD }, isPublished: true },
        orderBy: { stock: "asc" },
        take: 6,
      }),
    ]);

  const stats = [
    { label: "محصولات", value: productCount, icon: Package, href: "/admin/products" },
    { label: "خدمات", value: serviceCount, icon: Stethoscope, href: "/admin/services" },
    { label: "سفارش‌ها", value: orderCount, icon: ShoppingBag, href: "/admin/orders" },
  ];

  return (
    <div>
      <h1 className="text-xl font-bold text-foreground">داشبورد</h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {stats.map(({ label, value, icon: Icon, href }) => (
          <Link
            key={label}
            href={href}
            className="rounded-2xl border border-border bg-card p-5 hover:shadow-sm"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <p className="mt-4 text-2xl font-bold tabular-nums text-foreground">{value}</p>
            <p className="text-sm text-muted">{label}</p>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card">
          <h2 className="border-b border-border p-5 text-sm font-semibold text-foreground">
            سفارش‌های اخیر
          </h2>
          <ul className="divide-y divide-border">
            {recentOrders.map((o) => (
              <li key={o.id} className="flex items-center justify-between px-5 py-3 text-sm">
                <Link href={`/admin/orders/${o.id}`} className="font-medium text-primary hover:underline" dir="ltr">
                  {o.orderNumber}
                </Link>
                <Badge variant={ORDER_STATUS_BADGE[o.status]}>{ORDER_STATUS_LABELS[o.status]}</Badge>
              </li>
            ))}
            {recentOrders.length === 0 ? (
              <li className="px-5 py-8 text-center text-sm text-muted">سفارشی ثبت نشده است.</li>
            ) : null}
          </ul>
        </div>

        <div className="rounded-2xl border border-border bg-card">
          <h2 className="flex items-center gap-2 border-b border-border p-5 text-sm font-semibold text-foreground">
            <AlertTriangle className="h-4 w-4 text-accent" aria-hidden="true" />
            موجودی رو به اتمام
          </h2>
          <ul className="divide-y divide-border">
            {lowStockProducts.map((p) => (
              <li key={p.id} className="flex items-center justify-between px-5 py-3 text-sm">
                <Link href={`/admin/products/${p.id}`} className="font-medium text-foreground hover:underline">
                  {p.nameFa}
                </Link>
                <span className="tabular-nums text-accent font-semibold">{p.stock} عدد</span>
              </li>
            ))}
            {lowStockProducts.length === 0 ? (
              <li className="px-5 py-8 text-center text-sm text-muted">موردی برای هشدار نیست.</li>
            ) : null}
          </ul>
        </div>
      </div>
    </div>
  );
}
