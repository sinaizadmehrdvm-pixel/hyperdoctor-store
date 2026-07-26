"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { CalendarDays, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-context";

export function BookServiceButton({
  id,
  nameFa,
  nameEn,
  price,
  image,
  requiresBooking,
}: {
  id: string;
  nameFa: string;
  nameEn: string;
  price: number;
  image?: string | null;
  requiresBooking: boolean;
}) {
  const t = useTranslations("services");
  const { add } = useCart();
  const [date, setDate] = useState("");
  const [added, setAdded] = useState(false);

  const canSubmit = !requiresBooking || date.length > 0;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
      {requiresBooking ? (
        <label className="flex flex-col gap-1.5">
          <span className="flex items-center gap-1.5 text-xs font-medium text-muted">
            <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
            {t("preferredDate")}
          </span>
          <input
            type="date"
            value={date}
            min={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setDate(e.target.value)}
            className="h-11 rounded-lg border border-border bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
        </label>
      ) : null}
      <Button
        type="button"
        disabled={!canSubmit}
        onClick={() => {
          add({
            type: "service",
            id,
            nameFa,
            nameEn,
            price,
            image,
            quantity: 1,
            preferredDate: date || undefined,
          });
          setAdded(true);
          setTimeout(() => setAdded(false), 1500);
        }}
      >
        {added ? <Check className="h-4 w-4" aria-hidden="true" /> : null}
        {t("bookNow")}
      </Button>
    </div>
  );
}
