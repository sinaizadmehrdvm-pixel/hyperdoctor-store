"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import Image from "next/image";
import {
  BadgeCheck,
  Banknote,
  Check,
  CreditCard,
  Gift,
  Globe2,
  Loader2,
  LockKeyhole,
  PackageCheck,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
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
  const [paymentMethod, setPaymentMethod] = useState<"gateway" | "card">("gateway");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    const form = new FormData(event.currentTarget);

    if (paymentMethod !== "gateway") {
      setError(locale === "fa" ? "پرداخت کارت‌به‌کارت هنوز فعال نشده است. لطفاً درگاه اینترنتی را انتخاب کنید." : "Card-to-card payment is not active yet. Please use the secure gateway.");
      setSubmitting(false);
      return;
    }

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
    payment: locale === "fa" ? "انتخاب روش پرداخت" : locale === "tr" ? "Ödeme yöntemi seçin" : locale === "ar" ? "اختر طريقة الدفع" : "Choose payment method",
    gateway: locale === "fa" ? "درگاه اینترنتی امن" : locale === "tr" ? "Güvenli online ödeme" : locale === "ar" ? "بوابة دفع آمنة" : "Secure online gateway",
    gatewaySub: locale === "fa" ? "پرداخت سریع با کارت‌های بانکی پشتیبانی‌شده" : locale === "tr" ? "Desteklenen banka kartlarıyla hızlı ödeme" : locale === "ar" ? "دفع سريع بالبطاقات المصرفية المدعومة" : "Fast payment with supported bank cards",
    card: locale === "fa" ? "کارت به کارت" : locale === "tr" ? "Banka havalesi" : locale === "ar" ? "تحويل بنكي" : "Bank transfer",
    cardSub: locale === "fa" ? "نیاز به تایید دستی توسط پشتیبانی" : locale === "tr" ? "Manuel onay gerektirir" : locale === "ar" ? "يتطلب تأكيداً يدوياً" : "Requires manual verification",
    discount: locale === "fa" ? "کد تخفیف" : locale === "tr" ? "İndirim kodu" : locale === "ar" ? "كود الخصم" : "Discount code",
    verified: locale === "fa" ? "اطلاعات سفارش و قیمت‌ها قبل از پرداخت دوباره در سرور بررسی می‌شوند." : locale === "tr" ? "Sipariş ve fiyat bilgileri ödeme öncesinde sunucuda yeniden doğrulanır." : locale === "ar" ? "تتم إعادة التحقق من الطلب والأسعار على الخادم قبل الدفع." : "Order and pricing data are revalidated on the server before payment.",
  };

  return (
    <main className="flex-1 bg-[#f4f7fb] py-6 sm:py-10">
      <Container className="max-w-[1440px]">
        {/* Progress rail from Stitch 33 */}
        <section className="mb-8 hidden sm:block">
          <div className="relative grid grid-cols-3 items-start">
            <div className="absolute left-[16.5%] right-[16.5%] top-5 h-0.5 bg-[#001736]" />
            {[
              [Check, locale === "fa" ? "سبد خرید" : "Cart"],
              [Check, locale === "fa" ? "اطلاعات ارسال" : "Delivery details"],
              [CreditCard, locale === "fa" ? "پرداخت نهایی" : "Payment"],
            ].map(([IconValue, label], index) => {
              const Icon = IconValue as typeof Check;
              return (
                <div key={String(label)} className="relative z-10 flex flex-col items-center text-center">
                  <span className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${index < 2 ? "border-[#001736] bg-[#001736] text-white" : "border-[#001736] bg-[#eef3f9] text-[#001736]"}`}><Icon className="h-5 w-5" /></span>
                  <span className="mt-2 text-xs font-black text-[#001736]">{String(label)}</span>
                </div>
              );
            })}
          </div>
        </section>

        <form onSubmit={handleSubmit} className="grid gap-7 lg:grid-cols-[360px_minmax(0,1fr)] lg:items-start xl:grid-cols-[390px_minmax(0,1fr)]">
          {/* Order summary — left on desktop like Stitch 33 */}
          <aside className="order-2 lg:order-1 lg:sticky lg:top-28">
            <div className="rounded-3xl border border-[#dfe4ea] bg-white p-6 shadow-[0_18px_50px_rgba(0,23,54,.055)]">
              <div className="flex items-center justify-between gap-3 border-b border-[#e0e3e6] pb-5">
                <h2 className="text-lg font-black text-[#001736]">{labels.summary}</h2>
                <span className="rounded-lg bg-[#eef1f4] px-3 py-1.5 text-xs font-bold text-[#43474f]">{lines.reduce((sum, line) => sum + line.quantity, 0)} {locale === "fa" ? "کالا" : "items"}</span>
              </div>

              <ul className="mt-5 space-y-4">
                {lines.map((line) => {
                  const name = pickLocalized(locale, { fa: line.nameFa, tr: line.nameTr, en: line.nameEn, ar: line.nameAr });
                  return (
                    <li key={line.key} className="flex gap-3 rounded-2xl border border-[#e0e3e6] p-3">
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-[#edf1f5]">
                        {line.image ? <Image src={line.image} alt={name} fill className="object-contain p-1.5" sizes="64px" /> : null}
                      </div>
                      <div className="min-w-0 flex-1"><p className="line-clamp-2 text-xs font-bold leading-5 text-[#001736]">{name}</p><div className="mt-2 flex justify-between gap-2 text-xs"><span className="text-[#747780]">× {line.quantity}</span><strong className="tabular-nums text-[#ba0036]">{formatPrice(line.price * line.quantity, locale)} {c("currency")}</strong></div></div>
                    </li>
                  );
                })}
              </ul>

              <dl className="mt-6 space-y-3 border-t border-[#e0e3e6] pt-5 text-sm">
                <div className="flex justify-between gap-3"><dt className="text-[#43474f]">{cartT("subtotal")}</dt><dd className="font-bold tabular-nums text-[#001736]">{formatPrice(subtotal, locale)} {c("currency")}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-[#43474f]">{cartT("shipping")}</dt><dd className="text-xs text-[#747780]">{locale === "fa" ? "پس از تایید آدرس" : "After address confirmation"}</dd></div>
              </dl>

              <div className="mt-5 rounded-xl border border-[#dfe4ea] bg-[#f4f7fb] p-4">
                <div className="flex justify-between gap-3 text-sm font-black text-[#001736]"><span>{cartT("grandTotal")}</span><span className="tabular-nums">{formatPrice(subtotal, locale)} {c("currency")}</span></div>
              </div>

              <Button type="submit" disabled={submitting} className="mt-5 min-h-14 w-full justify-center rounded-xl bg-[#ba0036] font-black text-white shadow-[0_12px_28px_rgba(186,0,54,.18)] hover:bg-[#e80346]">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <LockKeyhole className="h-4 w-4" />}
                {t("submit")}
              </Button>
              <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-[#747780]"><ShieldCheck className="h-4 w-4" />{locale === "fa" ? "تضمین اصالت کالا و سلامت فرآیند خرید" : "Secure verified checkout"}</div>
            </div>
          </aside>

          <div className="order-1 space-y-5 lg:order-2">
            <section className="rounded-3xl border border-[#dfe4ea] bg-white p-5 shadow-[0_16px_44px_rgba(0,23,54,.045)] sm:p-7">
              <div className="mb-5 flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#001736] text-white"><PackageCheck className="h-5 w-5" /></span><h1 className="text-xl font-black text-[#001736] sm:text-2xl">{t("customerInfo")}</h1></div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t("fullName")} name="customerName" required />
                <Field label={t("phone")} name="phone" type="tel" dir="ltr" required />
                <Field label={t("email")} name="email" type="email" dir="ltr" />
                <Field label={labels.country} name="country" />
                <Field label={labels.province} name="province" />
                <Field label={t("city")} name="city" required />
                <Field label={t("postalCode")} name="postalCode" dir="ltr" />
              </div>
              <div className="mt-4 space-y-4"><Field label={t("address")} name="address" required as="textarea" /><Field label={t("notes")} name="notes" as="textarea" /></div>
            </section>

            <section className="rounded-3xl border border-[#dfe4ea] bg-white p-5 shadow-[0_16px_44px_rgba(0,23,54,.045)] sm:p-7">
              <div className="mb-5 flex items-center gap-2"><CreditCard className="h-5 w-5 text-[#ba0036]" /><h2 className="text-lg font-black text-[#001736]">{labels.payment}</h2></div>

              <div className="mb-5 flex items-center gap-3 rounded-xl border border-[#d9e6f8] bg-[#f5f9ff] p-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#001736] text-white"><ShieldCheck className="h-5 w-5" /></span>
                <div><strong className="block text-sm text-[#001736]">{locale === "fa" ? "اتصال امن SSL فعال است" : "Secure SSL connection"}</strong><span className="text-xs text-[#747780]">TLS 1.3</span></div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <button type="button" onClick={() => setPaymentMethod("gateway")} className={`relative min-h-40 rounded-2xl border-2 p-5 text-center transition ${paymentMethod === "gateway" ? "border-[#001736] bg-[#001f48] text-white shadow-[0_12px_30px_rgba(0,31,72,.15)]" : "border-[#c4c6d0] bg-white text-[#43474f]"}`}>
                  {paymentMethod === "gateway" ? <span className="absolute end-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-[#00498d]"><Check className="h-4 w-4" /></span> : null}
                  <Globe2 className="mx-auto h-9 w-9" /><strong className="mt-4 block text-sm">{labels.gateway}</strong><span className={`mt-2 block text-xs leading-5 ${paymentMethod === "gateway" ? "text-[#d6e3ff]" : "text-[#747780]"}`}>{labels.gatewaySub}</span>
                </button>
                <button type="button" onClick={() => setPaymentMethod("card")} className={`relative min-h-40 rounded-2xl border-2 p-5 text-center transition ${paymentMethod === "card" ? "border-[#001736] bg-[#001f48] text-white" : "border-[#c4c6d0] bg-white text-[#43474f]"}`}>
                  <Banknote className="mx-auto h-9 w-9" /><strong className="mt-4 block text-sm">{labels.card}</strong><span className={`mt-2 block text-xs leading-5 ${paymentMethod === "card" ? "text-[#d6e3ff]" : "text-[#747780]"}`}>{labels.cardSub}</span>
                </button>
              </div>
            </section>

            <section className="rounded-3xl border border-[#dfe4ea] bg-white p-5 shadow-[0_16px_44px_rgba(0,23,54,.04)] sm:p-7">
              <div className="mb-4 flex items-center gap-2"><Gift className="h-5 w-5 text-[#747780]" /><h2 className="text-lg font-black text-[#001736]">{labels.discount}</h2></div>
              <div className="flex gap-3"><input disabled placeholder={locale === "fa" ? "کد تخفیف خود را وارد کنید..." : "Enter discount code..."} className="h-12 flex-1 rounded-xl border border-[#c4c6d0] bg-[#f7fafd] px-4 text-sm text-[#747780]" /><button disabled type="button" className="rounded-xl bg-[#001736] px-7 text-xs font-bold text-white opacity-60">{locale === "fa" ? "اعمال کد" : "Apply"}</button></div>
            </section>

            <section className="rounded-2xl border border-[#a9bfd8] bg-[#edf4fb] p-4 text-xs leading-6 text-[#43474f]">
              <div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#001736]" /><span>{labels.verified}</span></div>
            </section>

            <section className="rounded-3xl border border-[#dfe4ea] bg-white p-6">
              <div className="mb-5 flex items-center gap-2"><BadgeCheck className="h-5 w-5 text-[#ba0036]" /><h2 className="text-base font-black text-[#001736]">{locale === "fa" ? "تضمین امنیت و سلامت خرید" : "Purchase protection"}</h2></div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="flex gap-3"><ShieldCheck className="h-6 w-6 shrink-0 text-[#001736]" /><div><strong className="text-sm text-[#001736]">{locale === "fa" ? "حفاظت از داده‌ها" : "Data protection"}</strong><p className="mt-1 text-xs leading-6 text-[#747780]">{locale === "fa" ? "اطلاعات شخصی و پرداختی تنها برای تکمیل سفارش استفاده می‌شود." : "Personal information is used only to complete your order."}</p></div></div>
                <div className="flex gap-3"><RotateCcw className="h-6 w-6 shrink-0 text-[#001736]" /><div><strong className="text-sm text-[#001736]">{locale === "fa" ? "سیاست بازگشت" : "Return policy"}</strong><p className="mt-1 text-xs leading-6 text-[#747780]">{locale === "fa" ? "شرایط بازگشت مطابق نوع محصول و ضوابط فروش بررسی می‌شود." : "Returns are handled according to product type and applicable sales terms."}</p></div></div>
              </div>
            </section>

            {error ? <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">{error}</div> : null}
          </div>
        </form>
      </Container>
    </main>
  );
}

function Field({ label, name, type = "text", required, dir, as = "input" }: { label: string; name: string; type?: string; required?: boolean; dir?: "ltr" | "rtl"; as?: "input" | "textarea" }) {
  const shared = "vitalis-focus w-full rounded-xl border border-[#c4c6d0] bg-[#fbfcfe] px-3.5 text-sm text-[#181c1e] placeholder:text-[#747780]";
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-bold text-[#43474f]">{label}</span>
      {as === "textarea" ? <textarea name={name} required={required} dir={dir} rows={4} className={shared} /> : <input name={name} type={type} required={required} dir={dir} className={`h-12 ${shared}`} />}
    </label>
  );
}
