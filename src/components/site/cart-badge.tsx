"use client";

import { ShoppingCart } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useCart } from "@/lib/cart-context";
import { useTranslations } from "next-intl";

export function CartBadge() {
  const { count } = useCart();
  const t = useTranslations("nav");

  return (
    <Link
      href="/cart"
      aria-label={t("cart")}
      className="relative inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#001736] text-white shadow-sm transition hover:bg-[#002b5b]"
    >
      <ShoppingCart className="h-4.5 w-4.5" aria-hidden="true" />
      {count > 0 ? (
        <span className="absolute -top-0.5 -end-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#e80346] px-1 text-[10px] font-bold text-white tabular-nums">
          {count}
        </span>
      ) : null}
    </Link>
  );
}
