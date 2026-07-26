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
  nameEn,
  price,
  image,
  disabled,
}: {
  type: "product" | "service";
  id: string;
  nameFa: string;
  nameEn: string;
  price: number;
  image?: string | null;
  disabled?: boolean;
}) {
  const t = useTranslations("shop");
  const { add } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center rounded-lg border border-border">
        <button
          type="button"
          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          className="flex h-11 w-11 items-center justify-center text-foreground hover:bg-muted-bg cursor-pointer"
          aria-label="-"
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="w-8 text-center text-sm font-semibold tabular-nums">
          {quantity}
        </span>
        <button
          type="button"
          onClick={() => setQuantity((q) => q + 1)}
          className="flex h-11 w-11 items-center justify-center text-foreground hover:bg-muted-bg cursor-pointer"
          aria-label="+"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      <Button
        type="button"
        disabled={disabled}
        onClick={() => {
          add({ type, id, nameFa, nameEn, price, image, quantity });
          setAdded(true);
          setTimeout(() => setAdded(false), 1500);
        }}
      >
        {added ? (
          <Check className="h-4 w-4" aria-hidden="true" />
        ) : (
          <ShoppingCart className="h-4 w-4" aria-hidden="true" />
        )}
        {t("addToCart")}
      </Button>
    </div>
  );
}
