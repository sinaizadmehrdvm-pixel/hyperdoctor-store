"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Package, FileUp, FolderTree, Stethoscope, CalendarCheck2,
  FileText, ShoppingBag, ImageIcon, Settings, Headphones, MessageSquareText,
  ShieldCheck, UsersRound, Boxes, Star, BadgePercent, BarChart3, PanelsTopLeft,
  Newspaper, CreditCard, ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/admin", label: "داشبورد", icon: LayoutDashboard },
  { href: "/admin/reports", label: "گزارش فروش", icon: BarChart3 },
  { href: "/admin/transactions", label: "تراکنش‌های مالی", icon: CreditCard },
  { href: "/admin/products", label: "محصولات", icon: Package },
  { href: "/admin/products/import", label: "ورود گروهی کالا", icon: FileUp },
  { href: "/admin/inventory", label: "موجودی و انبار", icon: Boxes },
  { href: "/admin/categories", label: "دسته‌بندی‌ها", icon: FolderTree },
  { href: "/admin/services", label: "خدمات", icon: Stethoscope },
  { href: "/admin/bookings", label: "رزرو خدمات", icon: CalendarCheck2 },
  { href: "/admin/orders", label: "سفارش‌ها", icon: ShoppingBag },
  { href: "/admin/customers", label: "کاربران", icon: UsersRound },
  { href: "/admin/reviews", label: "نظرات", icon: Star },
  { href: "/admin/discounts", label: "تخفیف‌ها", icon: BadgePercent },
  { href: "/admin/support", label: "تیکت‌های پشتیبانی", icon: Headphones },
  { href: "/admin/contacts", label: "پیام‌های تماس", icon: MessageSquareText },
  { href: "/admin/warranties", label: "گارانتی", icon: ShieldCheck },
  { href: "/admin/articles", label: "مقالات", icon: Newspaper },
  { href: "/admin/banners", label: "بنرها و جشنواره", icon: PanelsTopLeft },
  { href: "/admin/pages", label: "صفحات", icon: FileText },
  { href: "/admin/media", label: "رسانه‌ها", icon: ImageIcon },
  { href: "/admin/settings", label: "تنظیمات", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1.5 p-3">
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
              "group flex min-h-11 items-center gap-3 rounded-xl px-3 text-[13px] font-bold transition-all",
              active
                ? "bg-[#e80346] text-white shadow-[0_8px_22px_rgba(232,3,70,.20)]"
                : "text-[#5f6570] hover:bg-[#f1f4f7] hover:text-[#001736]"
            )}
          >
            <Icon className="h-4.5 w-4.5 shrink-0" aria-hidden="true" />
            <span className="flex-1">{item.label}</span>
            <ChevronLeft className={cn("h-3.5 w-3.5 opacity-0 transition", active ? "opacity-100" : "group-hover:opacity-40")} />
          </Link>
        );
      })}
    </nav>
  );
}
