"use client";

import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { Minus, Plus, Trash2, ImageOff } from "lucide-react";
import { Container } from "@/components/ui/container";
import { LinkButton } from "@/components/ui/button";
import { useCart } from "@/lib/cart-context";
import { formatPrice } from "@/lib/utils";

export default function CartPage() {
  const t = useTranslations("cart");
  const c = useTranslations("common");
  const locale = useLocale();
  const { lines, updateQuantity, remove, subtotal, hydrated } = useCart();

  return (
    <main className="flex-1 py-12">
      <Container>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{t("title")}</h1>

        {!hydrated ? null : lines.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-border p-16 text-center">
            <p className="text-sm text-muted">{t("empty")}</p>
            <LinkButton href="/shop" className="mt-6">
              {t("continueShopping")}
            </LinkButton>
          </div>
        ) : (
          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
            <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
              {lines.map((line) => (
                <li key={line.key} className="flex items-center gap-4 p-4 sm:p-5">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted-bg">
                    {line.image ? (
                      <Image src={line.image} alt="" fill className="object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-muted">
                        <ImageOff className="h-5 w-5" aria-hidden="true" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {locale === "fa" ? line.nameFa : line.nameEn}
                    </p>
                    {line.preferredDate ? (
                      <p className="mt-0.5 text-xs text-muted">{line.preferredDate}</p>
                    ) : null}
                    <p className="mt-1 text-sm font-medium text-foreground tabular-nums">
                      {formatPrice(line.price, locale)} {c("currency")}
                    </p>
                  </div>
                  <div className="flex items-center rounded-lg border border-border">
                    <button
                      type="button"
                      onClick={() => updateQuantity(line.key, line.quantity - 1)}
                      className="flex h-9 w-9 items-center justify-center text-foreground hover:bg-muted-bg cursor-pointer"
                      aria-label="-"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-7 text-center text-sm font-semibold tabular-nums">
                      {line.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(line.key, line.quantity + 1)}
                      className="flex h-9 w-9 items-center justify-center text-foreground hover:bg-muted-bg cursor-pointer"
                      aria-label="+"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(line.key)}
                    aria-label={t("remove")}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-accent/10 hover:text-accent cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>

            <div className="h-fit rounded-2xl border border-border bg-card p-6">
              <div className="flex justify-between text-sm text-muted">
                <span>{t("subtotal")}</span>
                <span className="tabular-nums text-foreground font-medium">
                  {formatPrice(subtotal, locale)} {c("currency")}
                </span>
              </div>
              <div className="mt-6 border-t border-border pt-4">
                <LinkButton href="/checkout" className="w-full justify-center">
                  {t("checkout")}
                </LinkButton>
              </div>
            </div>
          </div>
        )}
      </Container>
    </main>
  );
}
