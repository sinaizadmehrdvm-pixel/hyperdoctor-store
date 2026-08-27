import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { CheckCircle2, Home, ReceiptText, ShieldCheck, XCircle } from "lucide-react";
import { Container } from "@/components/ui/container";
import { LinkButton } from "@/components/ui/button";
import { ClearCartOnSuccess } from "@/components/site/clear-cart-on-success";
import { formatPrice } from "@/lib/utils";
import { supabaseRpc } from "@/lib/supabase-rest";

type OrderResult = {
  orderNumber: string;
  status: string;
  total: number;
  currency: string;
  locale: string;
  paymentRefId?: string | null;
};

export default async function OrderResultPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderNumber: string }>;
  searchParams: Promise<{ token?: string; status?: string }>;
}) {
  const [{ orderNumber }, query, locale, t] = await Promise.all([
    params,
    searchParams,
    getLocale(),
    getTranslations("orderResult"),
  ]);

  if (!query.token) notFound();

  let order: OrderResult | null = null;
  try {
    order = await supabaseRpc<OrderResult | null>("get_order_result", {
      p_order_number: orderNumber,
      p_result_token: query.token,
    });
  } catch (error) {
    console.error("[order-result] lookup failed", error);
  }
  if (!order) notFound();

  const success = order.status === "PAID";
  const copy = locale === "fa"
    ? { secure: "نتیجه سفارش با شناسه امن بررسی شد", ref: "کد مرجع پرداخت", amount: "مبلغ سفارش", next: success ? "سفارش شما ثبت و پرداخت تأیید شده است. جزئیات پردازش و ارسال توسط تیم Hyper Doctor پیگیری می‌شود." : "پرداخت این سفارش تأیید نشده است. در صورت کسر وجه یا نیاز به بررسی، با پشتیبانی تماس بگیرید." }
    : locale === "tr"
      ? { secure: "Sipariş sonucu güvenli kimlikle doğrulandı", ref: "Ödeme referansı", amount: "Sipariş tutarı", next: success ? "Siparişiniz kaydedildi ve ödeme onaylandı. Hyper Doctor ekibi işleme ve teslimatı takip edecektir." : "Bu siparişin ödemesi onaylanmadı. Gerekirse destek ekibimizle iletişime geçin." }
      : locale === "ar"
        ? { secure: "تم التحقق من نتيجة الطلب بمعرّف آمن", ref: "مرجع الدفع", amount: "قيمة الطلب", next: success ? "تم تسجيل الطلب وتأكيد الدفع، وسيتابع فريق Hyper Doctor التجهيز والتسليم." : "لم يتم تأكيد دفع هذا الطلب. تواصل مع الدعم إذا احتجت إلى مراجعة العملية." }
        : { secure: "Order result verified with a secure identifier", ref: "Payment reference", amount: "Order amount", next: success ? "Your order is registered and payment is confirmed. The Hyper Doctor team will follow processing and delivery." : "Payment for this order was not confirmed. Contact support if the transaction needs review." };

  return (
    <main className="flex-1 bg-[#f5f8fb] py-12 sm:py-20">
      {success ? <ClearCartOnSuccess /> : null}
      <Container className="max-w-2xl">
        <section className="overflow-hidden rounded-[2rem] border border-[#dfe4ea] bg-white shadow-[0_24px_65px_rgba(0,23,54,.08)]">
          <div className={`px-6 py-10 text-center text-white sm:px-10 ${success ? "bg-[#001736]" : "bg-[#571527]"}`}>
            <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-white/15 bg-white/10 backdrop-blur">
              {success ? <CheckCircle2 className="h-11 w-11 text-[#82cfff]" /> : <XCircle className="h-11 w-11 text-[#ffdada]" />}
            </span>
            <h1 className="mt-6 text-2xl font-black sm:text-3xl">{success ? t("successTitle") : t("failTitle")}</h1>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-white/75">{success ? t("successBody") : t("failBody")}</p>
          </div>

          <div className="p-6 sm:p-8">
            <div className="flex items-center gap-2 rounded-xl border border-[#d9e6f8] bg-[#f5f9ff] p-3 text-xs font-bold text-[#34506f]"><ShieldCheck className="h-4 w-4 text-[#009dd8]" />{copy.secure}</div>
            <dl className="mt-5 divide-y divide-[#e0e3e6] rounded-2xl border border-[#e0e3e6] bg-[#f9fbfd] px-5">
              <ResultRow label={t("orderNumber")} value={order.orderNumber} />
              <ResultRow label={copy.amount} value={`${formatPrice(order.total, locale)} ${locale === "fa" ? "تومان" : order.currency}`} />
              {order.paymentRefId ? <ResultRow label={copy.ref} value={order.paymentRefId} /> : null}
            </dl>
            <p className="mt-5 text-sm leading-7 text-[#5f6570]">{copy.next}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <LinkButton href="/" className="gap-2 rounded-xl"><Home className="h-4 w-4" />{t("backHome")}</LinkButton>
              <LinkButton href="/contact" variant="secondary" className="gap-2 rounded-xl"><ReceiptText className="h-4 w-4" />Hyper Doctor Support</LinkButton>
            </div>
          </div>
        </section>
      </Container>
    </main>
  );
}

function ResultRow({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between gap-4 py-4 text-sm"><dt className="font-bold text-[#747780]">{label}</dt><dd dir="ltr" className="text-end font-black tabular-nums text-[#001736]">{value}</dd></div>;
}
