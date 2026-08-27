"use client";

import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { Minus, Plus, Trash2, ImageOff, ShieldCheck, Truck } from "lucide-react";
import { Container } from "@/components/ui/container";
import { LinkButton } from "@/components/ui/button";
import { useCart } from "@/lib/cart-context";
import { formatPrice } from "@/lib/utils";
import { pickLocalized } from "@/lib/i18n-content";

export default function CartPage() {
  const t = useTranslations("cart");
  const c = useTranslations("common");
  const locale = useLocale();
  const { lines, updateQuantity, remove, subtotal, hydrated } = useCart();

  return (
    <main className="flex-1 py-8 sm:py-12">
      <Container>
        <div className="vitalis-dark-panel rounded-3xl px-5 py-7 sm:px-8 sm:py-9">
          <h1 className="text-2xl font-black text-white sm:text-4xl">{t("title")}</h1>
          <p className="mt-2 text-sm text-navy-muted">
            {locale === "fa" ? "محصولات، تعداد و اطلاعات سفارش را قبل از پرداخت بررسی کنید." : locale === "tr" ? "Ödeme öncesinde ürünlerinizi ve adetleri kontrol edin." : locale === "ar" ? "راجع المنتجات والكميات قبل إتمام الدفع." : "Review your products and quantities before checkout."}
          </p>
        </div>

        {!hydrated ? null : lines.length === 0 ? (
          <div className="vitalis-panel mt-8 flex min-h-64 flex-col items-center justify-center p-10 text-center">
            <p className="text-sm text-muted">{t("empty")}</p>
            <LinkButton href="/shop" className="mt-6">{t("continueShopping")}</LinkButton>
          </div>
        ) : (
          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_350px]">
            <ul className="space-y-3">
              {lines.map((line) => {
                const lineName = pickLocalized(locale, { fa: line.nameFa, tr: line.nameTr, en: line.nameEn, ar: line.nameAr });
                return (
                  <li key={line.key} className="vitalis-panel flex flex-wrap items-center gap-4 p-4 sm:flex-nowrap sm:p-5">
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-muted-bg sm:h-24 sm:w-24">
                      {line.image ? (
                        <Image src={line.image} alt={lineName} fill className="object-contain p-2" sizes="96px" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-muted"><ImageOff className="h-5 w-5" aria-hidden="true" /></div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-bold text-foreground sm:text-base">{lineName}</p>
                      {line.preferredDate ? <p className="mt-1 text-xs text-muted">{line.preferredDate}</p> : null}
                      <p className="mt-2 text-sm font-black text-primary tabular-nums">
                        {formatPrice(line.price, locale)} <span className="text-xs font-medium text-muted">{c("currency")}</span>
                      </p>
                    </div>

                    <div className="flex items-center overflow-hidden rounded-xl border border-border bg-white">
                      <button type="button" onClick={() => updateQuantity(line.key, line.quantity - 1)} className="vitalis-focus flex h-10 w-10 items-center justify-center text-foreground hover:bg-muted-bg" aria-label="Decrease quantity">
                        <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                      <span className="w-8 text-center text-sm font-bold tabular-nums">{line.quantity}</span>
                      <button type="button" onClick={() => updateQuantity(line.key, line.quantity + 1)} className="vitalis-focus flex h-10 w-10 items-center justify-center text-foreground hover:bg-muted-bg" aria-label="Increase quantity">
                        <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </div>

                    <button type="button" onClick={() => remove(line.key)} aria-label={t("remove")} className="vitalis-focus flex h-10 w-10 items-center justify-center rounded-xl text-muted transition hover:bg-accent/10 hover:text-accent">
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </li>
                );
              })}
            </ul>

            <aside className="lg:sticky lg:top-28 lg:self-start">
              <div className="vitalis-panel p-6">
                <h2 className="text-base font-black text-foreground">
                  {locale === "fa" ? "خلاصه سفارش" : locale === "tr" ? "Sipariş özeti" : locale === "ar" ? "ملخص الطلب" : "Order summary"}
                </h2>
                <div className="mt-5 flex justify-between gap-3 text-sm text-muted">
                  <span>{t("subtotal")}</span>
                  <span className="font-bold text-foreground tabular-nums">{formatPrice(subtotal, locale)} {c("currency")}</span>
                </div>
                <div className="mt-3 flex justify-between gap-3 text-sm text-muted">
                  <span>{t("shipping")}</span>
                  <span>{locale === "fa" ? "در مرحله بعد محاسبه می‌شود" : locale === "tr" ? "Sonraki adımda hesaplanır" : locale === "ar" ? "يُحسب في الخطوة التالية" : "Calculated next"}</span>
                </div>
                <div className="mt-6 border-t border-border pt-5">
                  <LinkButton href="/checkout" className="w-full justify-center rounded-xl">{t("checkout")}</LinkButton>
                </div>
              </div>

              <div className="mt-4 grid gap-2 text-xs text-muted">
                <div className="flex items-center gap-2 rounded-xl border border-border bg-white p-3"><ShieldCheck className="h-4 w-4 text-primary-glow" aria-hidden="true" />{locale === "fa" ? "پرداخت امن و حفاظت از اطلاعات" : locale === "tr" ? "Güvenli ödeme ve veri koruması" : locale === "ar" ? "دفع آمن وحماية البيانات" : "Secure payment and data protection"}</div>
                <div className="flex items-center gap-2 rounded-xl border border-border bg-white p-3"><Truck className="h-4 w-4 text-primary-glow" aria-hidden="true" />{locale === "fa" ? "ارسال ایمن تجهیزات پزشکی" : locale === "tr" ? "Güvenli medikal ürün teslimatı" : locale === "ar" ? "شحن آمن للمعدات الطبية" : "Secure medical-equipment delivery"}</div>
              </div>
            </aside>
          </div>
        )}
      </Container>
    </main>
  );
}
