"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { CreditCard, Loader2, LockKeyhole, PackageCheck, ShieldCheck } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-context";
import { formatPrice } from "@/lib/utils";
import { pickLocalized } from "@/lib/i18n-content";

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
          province: form.get("province") || undefined,
          city: form.get("city"),
          country: form.get("country") || undefined,
          postalCode: form.get("postalCode") || undefined,
          notes: form.get("notes") || undefined,
          lines: lines.map((line) => ({
            type: line.type,
            id: line.id,
            quantity: line.quantity,
            preferredDate: line.preferredDate,
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

  if (!hydrated || lines.length === 0) return null;

  const labels = {
    province: locale === "fa" ? "استان" : locale === "tr" ? "İl / Bölge" : locale === "ar" ? "المحافظة / المنطقة" : "Province / Region",
    country: locale === "fa" ? "کشور" : locale === "tr" ? "Ülke" : locale === "ar" ? "الدولة" : "Country",
    summary: locale === "fa" ? "خلاصه سفارش" : locale === "tr" ? "Sipariş özeti" : locale === "ar" ? "ملخص الطلب" : "Order summary",
    secure: locale === "fa" ? "پرداخت امن" : locale === "tr" ? "Güvenli ödeme" : locale === "ar" ? "دفع آمن" : "Secure payment",
    verified: locale === "fa" ? "اطلاعات سفارش قبل از پرداخت دوباره از سرور بررسی می‌شود." : locale === "tr" ? "Sipariş ve fiyat bilgileri ödeme öncesinde sunucuda yeniden doğrulanır." : locale === "ar" ? "تتم إعادة التحقق من الطلب والأسعار على الخادم قبل الدفع." : "Order and pricing data are revalidated on the server before payment.",
  };

  return (
    <main className="flex-1 py-8 sm:py-12">
      <Container className="max-w-6xl">
        <section className="vitalis-dark-panel rounded-3xl px-5 py-7 sm:px-8 sm:py-9">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-primary-glow"><CreditCard className="h-5 w-5" aria-hidden="true" /></span>
            <div>
              <h1 className="text-2xl font-black text-white sm:text-4xl">{t("title")}</h1>
              <p className="mt-1 text-sm text-navy-muted">{labels.secure}</p>
            </div>
          </div>
        </section>

        <form onSubmit={handleSubmit} className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
          <section className="vitalis-panel p-5 sm:p-7">
            <h2 className="text-base font-black text-foreground">{t("customerInfo")}</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label={t("fullName")} name="customerName" required />
              <Field label={t("phone")} name="phone" type="tel" dir="ltr" required />
              <Field label={t("email")} name="email" type="email" dir="ltr" />
              <Field label={labels.country} name="country" />
              <Field label={labels.province} name="province" />
              <Field label={t("city")} name="city" required />
              <Field label={t("postalCode")} name="postalCode" dir="ltr" />
            </div>
            <div className="mt-4 space-y-4">
              <Field label={t("address")} name="address" required as="textarea" />
              <Field label={t("notes")} name="notes" as="textarea" />
            </div>

            {error ? <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">{error}</div> : null}

            <div className="mt-6 rounded-xl border border-border bg-muted-bg/70 p-4 text-xs leading-6 text-muted">
              <div className="flex items-start gap-2"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary-glow" aria-hidden="true" /><span>{labels.verified}</span></div>
            </div>
          </section>

          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="vitalis-panel p-6">
              <h2 className="text-base font-black text-foreground">{labels.summary}</h2>
              <ul className="mt-5 space-y-4">
                {lines.map((line) => {
                  const name = pickLocalized(locale, { fa: line.nameFa, tr: line.nameTr, en: line.nameEn, ar: line.nameAr });
                  return (
                    <li key={line.key} className="flex justify-between gap-4 text-sm">
                      <span className="line-clamp-2 text-muted">{name} × {line.quantity}</span>
                      <span className="shrink-0 font-bold text-foreground tabular-nums">{formatPrice(line.price * line.quantity, locale)}</span>
                    </li>
                  );
                })}
              </ul>
              <div className="mt-5 border-t border-border pt-5">
                <div className="flex justify-between gap-3 text-sm font-black text-foreground">
                  <span>{cartT("grandTotal")}</span>
                  <span className="tabular-nums">{formatPrice(subtotal, locale)} {c("currency")}</span>
                </div>
                <Button type="submit" disabled={submitting} className="mt-5 min-h-12 w-full justify-center rounded-xl bg-primary font-black text-white hover:bg-primary-container">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <LockKeyhole className="h-4 w-4" aria-hidden="true" />}
                  {t("submit")}
                </Button>
                <p className="mt-3 text-center text-xs leading-5 text-muted">{t("gatewayNote")}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-border bg-white p-3 text-xs text-muted"><PackageCheck className="h-4 w-4 text-primary-glow" aria-hidden="true" />Hyper Doctor · VITALIS Group</div>
          </aside>
        </form>
      </Container>
    </main>
  );
}

function Field({ label, name, type = "text", required, dir, as = "input" }: { label: string; name: string; type?: string; required?: boolean; dir?: "ltr" | "rtl"; as?: "input" | "textarea" }) {
  const shared = "vitalis-focus w-full rounded-xl border border-border bg-white px-3.5 text-sm text-foreground placeholder:text-muted";
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-muted">{label}</span>
      {as === "textarea" ? <textarea name={name} required={required} dir={dir} rows={4} className={shared} /> : <input name={name} type={type} required={required} dir={dir} className={`h-12 ${shared}`} />}
    </label>
  );
}
