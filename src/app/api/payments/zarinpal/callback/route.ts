import { NextResponse } from "next/server";
import { verifyZarinpalPayment } from "@/lib/payments/zarinpal";
import { supabaseRpc } from "@/lib/supabase-rest";

type PaymentContext = {
  orderId: string;
  orderNumber: string;
  total: number;
  locale: "fa" | "tr" | "en" | "ar";
  status: string;
  resultToken: string;
};

type FinalizedOrder = {
  orderNumber: string;
  status: string;
  locale: "fa" | "tr" | "en" | "ar";
  resultToken: string;
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const authority = url.searchParams.get("Authority");
  const status = url.searchParams.get("Status");
  const orderNumber = url.searchParams.get("order");
  const checkoutToken = url.searchParams.get("ct");
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? url.origin;

  if (!authority || !orderNumber || !checkoutToken) {
    return NextResponse.redirect(`${site}/fa/order/unknown/result?status=fail`);
  }

  let context: PaymentContext | null = null;
  try {
    context = await supabaseRpc<PaymentContext | null>("get_order_payment_context", {
      p_order_number: orderNumber,
      p_checkout_token: checkoutToken,
      p_authority: authority,
    });
  } catch (error) {
    console.error("[zarinpal-callback] context lookup failed", error);
  }

  if (!context) {
    return NextResponse.redirect(`${site}/fa/order/${encodeURIComponent(orderNumber)}/result?status=fail`);
  }

  const resultUrl = (result: "success" | "fail", token = context!.resultToken) => {
    const target = new URL(`${site}/${context!.locale}/order/${encodeURIComponent(context!.orderNumber)}/result`);
    target.searchParams.set("status", result);
    target.searchParams.set("token", token);
    return target.toString();
  };

  if (context.status === "PAID") return NextResponse.redirect(resultUrl("success"));
  if (context.status === "FAILED") return NextResponse.redirect(resultUrl("fail"));

  if (status !== "OK") {
    const finalized = await supabaseRpc<FinalizedOrder | null>("finalize_order_payment", {
      p_order_number: orderNumber,
      p_checkout_token: checkoutToken,
      p_authority: authority,
      p_success: false,
      p_ref_id: null,
    }).catch((error) => {
      console.error("[zarinpal-callback] failure finalization failed", error);
      return null;
    });
    return NextResponse.redirect(resultUrl("fail", finalized?.resultToken ?? context.resultToken));
  }

  const verification = await verifyZarinpalPayment({
    amountToman: context.total,
    authority,
  });

  if (!verification.success) {
    const finalized = await supabaseRpc<FinalizedOrder | null>("finalize_order_payment", {
      p_order_number: orderNumber,
      p_checkout_token: checkoutToken,
      p_authority: authority,
      p_success: false,
      p_ref_id: null,
    }).catch(() => null);
    return NextResponse.redirect(resultUrl("fail", finalized?.resultToken ?? context.resultToken));
  }

  const finalized = await supabaseRpc<FinalizedOrder | null>("finalize_order_payment", {
    p_order_number: orderNumber,
    p_checkout_token: checkoutToken,
    p_authority: authority,
    p_success: true,
    p_ref_id: verification.refId ?? null,
  });

  if (!finalized || finalized.status !== "PAID") {
    return NextResponse.redirect(resultUrl("fail"));
  }

  return NextResponse.redirect(resultUrl("success", finalized.resultToken));
}
