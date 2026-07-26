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
      className="relative inline-flex h-11 w-11 items-center justify-center rounded-full text-navy-foreground hover:bg-white/10 transition-colors"
    >
      <ShoppingCart className="h-5 w-5" aria-hidden="true" />
      {count > 0 ? (
        <span className="absolute top-1.5 end-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-white tabular-nums">
          {count}
        </span>
      ) : null}
    </Link>
  );
}
