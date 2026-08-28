"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Minus, Plus, ShoppingCart, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-context";

function l(locale: string, fa: string, en: string, tr: string, ar: string) {
  if (locale === "en") return en;
  if (locale === "tr") return tr;
  if (locale === "ar") return ar;
  return fa;
}

export function AddToCartButton({ type, id, nameFa, nameTr, nameEn, nameAr, price, image, disabled, minQuantity, maxQuantity }: {
  type: "product" | "service"; id: string; nameFa: string; nameTr?: string; nameEn: string; nameAr?: string; price: number; image?: string | null; disabled?: boolean; minQuantity?: number | null; maxQuantity?: number | null;
}) {
  const t = useTranslations("shop");
  const locale = useLocale();
  const { add } = useCart();
  const rawMin = Number(minQuantity);
  const min = type === "service" ? 1 : minQuantity != null && Number.isFinite(rawMin) && rawMin > 0 ? Math.min(50, Math.max(1, Math.floor(rawMin))) : 1;
  const rawMax = Number(maxQuantity);
  const explicitZero = maxQuantity !== null && maxQuantity !== undefined && Number.isFinite(rawMax) && rawMax <= 0;
  const max = type === "service" ? 1 : maxQuantity !== null && maxQuantity !== undefined && Number.isFinite(rawMax) && rawMax > 0 ? Math.max(min, Math.min(50, Math.floor(rawMax))) : null;
  const unavailable = Boolean(disabled) || explicitZero || (max !== null && max < min);
  const [quantity, setQuantity] = useState(min);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    setQuantity((q) => Math.max(min, max === null ? q : Math.min(max, q)));
  }, [min, max]);

  const decreaseLabel = l(locale, "کاهش تعداد", "Decrease quantity", "Adedi azalt", "تقليل الكمية");
  const increaseLabel = l(locale, "افزایش تعداد", "Increase quantity", "Adedi artır", "زيادة الكمية");
  const addedLabel = l(locale, "به سبد خرید اضافه شد", "Added to cart", "Sepete eklendi", "تمت الإضافة إلى السلة");
  const minimumLabel = l(locale, "حداقل تعداد سفارش", "Minimum order quantity", "Minimum sipariş adedi", "الحد الأدنى للطلب");

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center overflow-hidden rounded-xl border border-border bg-white shadow-sm" aria-label={l(locale,"تعداد","Quantity","Adet","الكمية")}>
          <button type="button" onClick={() => setQuantity((q) => Math.max(min, q - 1))} disabled={unavailable || quantity <= min} className="vitalis-focus flex h-12 w-12 cursor-pointer items-center justify-center text-foreground transition hover:bg-muted-bg disabled:cursor-not-allowed disabled:opacity-40" aria-label={decreaseLabel}>
            <Minus className="h-4 w-4" aria-hidden="true" />
          </button>
          <span className="w-10 text-center text-sm font-bold tabular-nums" aria-live="polite">{new Intl.NumberFormat(locale).format(quantity)}</span>
          <button type="button" onClick={() => setQuantity((q) => max === null ? q + 1 : Math.min(max, q + 1))} disabled={unavailable || (max !== null && quantity >= max)} className="vitalis-focus flex h-12 w-12 cursor-pointer items-center justify-center text-foreground transition hover:bg-muted-bg disabled:cursor-not-allowed disabled:opacity-40" aria-label={increaseLabel}>
            <Plus className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <Button type="button" size="lg" disabled={unavailable} className="min-h-12 min-w-48 rounded-xl bg-primary px-6 font-bold text-white shadow-[0_12px_28px_rgba(0,23,54,0.16)] hover:bg-primary-container" onClick={() => {
          if (unavailable || quantity < min || (max !== null && quantity > max)) return;
          add({ type, id, nameFa, nameTr, nameEn, nameAr, price, image, quantity, minQuantity: type === "service" ? 1 : min, maxQuantity: type === "service" ? 1 : max });
          setAdded(true);
          window.setTimeout(() => setAdded(false), 1500);
        }}>
          {added ? <Check className="h-4 w-4" aria-hidden="true" /> : <ShoppingCart className="h-4 w-4" aria-hidden="true" />}
          {added ? addedLabel : t("addToCart")}
        </Button>
      </div>
      {type === "product" && min > 1 ? <p className="mt-2 text-xs font-bold text-[#747780]">{minimumLabel}: {new Intl.NumberFormat(locale).format(min)}</p> : null}
    </div>
  );
}
