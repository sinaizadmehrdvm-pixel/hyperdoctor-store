"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  FileUp,
  FolderTree,
  Stethoscope,
  CalendarCheck2,
  FileText,
  ShoppingBag,
  ImageIcon,
  Settings,
  Headphones,
  MessageSquareText,
  ShieldCheck,
  UsersRound,
  Boxes,
  Star,
  BadgePercent,
} from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/admin", label: "داشبورد", icon: LayoutDashboard },
  { href: "/admin/products", label: "محصولات", icon: Package },
  { href: "/admin/products/import", label: "ورود گروهی کالا", icon: FileUp },
  { href: "/admin/inventory", label: "موجودی و انبار", icon: Boxes },
  { href: "/admin/categories", label: "دسته‌بندی‌ها", icon: FolderTree },
  { href: "/admin/services", label: "خدمات", icon: Stethoscope },
  { href: "/admin/bookings", label: "رزرو خدمات", icon: CalendarCheck2 },
  { href: "/admin/orders", label: "سفارش‌ها", icon: ShoppingBag },
  { href: "/admin/customers", label: "مشتریان", icon: UsersRound },
  { href: "/admin/reviews", label: "نظرات", icon: Star },
  { href: "/admin/discounts", label: "تخفیف‌ها", icon: BadgePercent },
  { href: "/admin/support", label: "پشتیبانی", icon: Headphones },
  { href: "/admin/contacts", label: "پیام‌های تماس", icon: MessageSquareText },
  { href: "/admin/warranties", label: "گارانتی", icon: ShieldCheck },
  { href: "/admin/pages", label: "صفحات", icon: FileText },
  { href: "/admin/media", label: "رسانه‌ها", icon: ImageIcon },
  { href: "/admin/settings", label: "تنظیمات", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 p-4">
      {items.map((item) => {
        const active = item.href === "/admin"
          ? pathname === "/admin"
          : item.href === "/admin/products"
            ? pathname === "/admin/products" || /^\/admin\/products\/(new|[^/]+)$/.test(pathname)
            : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors",
              active ? "bg-primary text-white shadow-sm" : "text-foreground hover:bg-muted-bg",
            )}
          >
            <Icon className="h-4.5 w-4.5" aria-hidden="true" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
