"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Minus, Plus, ShoppingCart, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-context";

export function AddToCartButton({
  type,
  id,
  nameFa,
  nameTr,
  nameEn,
  nameAr,
  price,
  image,
  disabled,
  maxQuantity,
}: {
  type: "product" | "service";
  id: string;
  nameFa: string;
  nameTr?: string;
  nameEn: string;
  nameAr?: string;
  price: number;
  image?: string | null;
  disabled?: boolean;
  maxQuantity?: number | null;
}) {
  const t = useTranslations("shop");
  const { add } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const max = maxQuantity && maxQuantity > 0 ? maxQuantity : Number.POSITIVE_INFINITY;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center overflow-hidden rounded-xl border border-border bg-white shadow-sm">
        <button
          type="button"
          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          className="vitalis-focus flex h-12 w-12 items-center justify-center text-foreground transition hover:bg-muted-bg cursor-pointer"
          aria-label="Decrease quantity"
        >
          <Minus className="h-4 w-4" aria-hidden="true" />
        </button>
        <span className="w-10 text-center text-sm font-bold tabular-nums">{quantity}</span>
        <button
          type="button"
          onClick={() => setQuantity((q) => Math.min(max, q + 1))}
          disabled={quantity >= max}
          className="vitalis-focus flex h-12 w-12 items-center justify-center text-foreground transition hover:bg-muted-bg disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
          aria-label="Increase quantity"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <Button
        type="button"
        size="lg"
        disabled={disabled}
        className="min-h-12 min-w-48 rounded-xl bg-primary px-6 font-bold text-white shadow-[0_12px_28px_rgba(0,23,54,0.16)] hover:bg-primary-container"
        onClick={() => {
          add({ type, id, nameFa, nameTr, nameEn, nameAr, price, image, quantity });
          setAdded(true);
          window.setTimeout(() => setAdded(false), 1500);
        }}
      >
        {added ? <Check className="h-4 w-4" aria-hidden="true" /> : <ShoppingCart className="h-4 w-4" aria-hidden="true" />}
        {t("addToCart")}
      </Button>
    </div>
  );
}
