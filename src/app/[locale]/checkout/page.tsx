"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Loader2 } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-context";
import { formatPrice } from "@/lib/utils";

export default function CheckoutPage() {
  const t = useTranslations("checkout");
  const cartT = useTranslations("cart");
  const c = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const { lines, subtotal, hydrated } = useCart();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale,
          customerName: form.get("customerName"),
          phone: form.get("phone"),
          email: form.get("email") || undefined,
          address: form.get("address"),
          city: form.get("city"),
          postalCode: form.get("postalCode") || undefined,
          notes: form.get("notes") || undefined,
          lines: lines.map((l) => ({
            type: l.type,
            id: l.id,
            quantity: l.quantity,
            preferredDate: l.preferredDate,
          })),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Checkout failed");
      window.location.href = data.redirectUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
      setSubmitting(false);
    }
  }

  useEffect(() => {
    if (hydrated && lines.length === 0) router.replace("/cart");
  }, [hydrated, lines.length, router]);

  if (!hydrated || lines.length === 0) {
    return null;
  }

  return (
    <main className="flex-1 py-12">
      <Container className="max-w-4xl">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{t("title")}</h1>

        <form onSubmit={handleSubmit} className="mt-8 grid gap-8 lg:grid-cols-[1fr_300px]">
          <div className="space-y-5 rounded-2xl border border-border bg-card p-6">
            <h2 className="text-sm font-semibold text-foreground">{t("customerInfo")}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("fullName")} name="customerName" required />
              <Field label={t("phone")} name="phone" type="tel" dir="ltr" required />
              <Field label={t("email")} name="email" type="email" dir="ltr" />
              <Field label={t("city")} name="city" required />
            </div>
            <Field label={t("address")} name="address" required as="textarea" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("postalCode")} name="postalCode" dir="ltr" />
            </div>
            <Field label={t("notes")} name="notes" as="textarea" />

            {error ? <p className="text-sm text-accent">{error}</p> : null}

            <Button type="submit" disabled={submitting} className="w-full justify-center">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
              {t("submit")}
            </Button>
            <p className="text-xs text-muted">{t("gatewayNote")}</p>
          </div>

          <div className="h-fit rounded-2xl border border-border bg-card p-6">
            <h2 className="text-sm font-semibold text-foreground mb-4">{cartT("title")}</h2>
            <ul className="space-y-3">
              {lines.map((l) => (
                <li key={l.key} className="flex justify-between gap-3 text-sm">
                  <span className="text-muted">
                    {locale === "fa" ? l.nameFa : l.nameEn} × {l.quantity}
                  </span>
                  <span className="font-medium text-foreground tabular-nums">
                    {formatPrice(l.price * l.quantity, locale)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex justify-between border-t border-border pt-4 text-sm font-semibold">
              <span>{cartT("grandTotal")}</span>
              <span className="tabular-nums">
                {formatPrice(subtotal, locale)} {c("currency")}
              </span>
            </div>
          </div>
        </form>
      </Container>
    </main>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  dir,
  as = "input",
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  dir?: "ltr" | "rtl";
  as?: "input" | "textarea";
}) {
  const sharedClass =
    "w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";
  return (
    <label className="flex flex-col gap-1.5 sm:col-span-2 [&:has(input)]:sm:col-span-1">
      <span className="text-xs font-medium text-muted">{label}</span>
      {as === "textarea" ? (
        <textarea name={name} required={required} dir={dir} rows={3} className={sharedClass} />
      ) : (
        <input
          name={name}
          type={type}
          required={required}
          dir={dir}
          className={`h-11 ${sharedClass}`}
        />
      )}
    </label>
  );
}
