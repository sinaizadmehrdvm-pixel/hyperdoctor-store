import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requestZarinpalPayment } from "@/lib/payments/zarinpal";
import { supabaseRpc } from "@/lib/supabase-rest";

const lineSchema = z.object({
  type: z.enum(["product", "service"]),
  id: z.string().min(1).max(160),
  quantity: z.number().int().min(1).max(50),
  preferredDate: z.string().optional(),
});

const checkoutSchema = z.object({
  locale: z.enum(["fa", "tr", "en", "ar"]),
  customerName: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(8).max(24),
  email: z.string().trim().email().optional().or(z.literal("")),
  address: z.string().trim().min(5).max(500),
  province: z.string().trim().max(120).optional(),
  city: z.string().trim().min(2).max(120),
  country: z.string().trim().max(120).optional(),
  postalCode: z.string().trim().max(20).optional(),
  notes: z.string().trim().max(1000).optional(),
  lines: z.array(lineSchema).min(1).max(100),
});

type CreatedOrder = {
  orderId: string;
  orderNumber: string;
  total: number;
  checkoutToken: string;
  resultToken: string;
  status: string;
};

export async function POST(request: Request) {
  const parsed = checkoutSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid checkout payload" }, { status: 400 });
  }

  const body = parsed.data;
  let order: CreatedOrder | null = null;

  try {
    order = await supabaseRpc<CreatedOrder>("create_guest_order", {
      p_request_token: randomUUID(),
      p_customer_name: body.customerName,
      p_phone: body.phone,
      p_email: body.email || null,
      p_address: body.address,
      p_province: body.province || "",
      p_city: body.city,
      p_country: body.country || "",
      p_postal_code: body.postalCode || null,
      p_notes: body.notes || "",
      p_locale: body.locale,
      p_lines: body.lines,
    });

    if (!order?.orderNumber || !order.checkoutToken || !Number.isInteger(order.total) || order.total <= 0) {
      throw new Error("Order could not be created");
    }

    const { authority, redirectUrl } = await requestZarinpalPayment({
      amountToman: order.total,
      description: `Hyper Doctor order ${order.orderNumber}`,
      orderNumber: order.orderNumber,
      checkoutToken: order.checkoutToken,
      mobile: body.phone,
      email: body.email || undefined,
    });

    const attached = await supabaseRpc<boolean>("attach_order_payment_authority", {
      p_order_number: order.orderNumber,
      p_checkout_token: order.checkoutToken,
      p_authority: authority,
    });

    if (!attached) {
      await supabaseRpc<boolean>("cancel_guest_order", {
        p_order_number: order.orderNumber,
        p_checkout_token: order.checkoutToken,
      }).catch(() => false);
      throw new Error("Payment session could not be attached to the order");
    }

    return NextResponse.json({ redirectUrl, orderNumber: order.orderNumber });
  } catch (error) {
    if (order?.orderNumber && order.checkoutToken) {
      await supabaseRpc<boolean>("cancel_guest_order", {
        p_order_number: order.orderNumber,
        p_checkout_token: order.checkoutToken,
      }).catch(() => false);
    }

    const message = error instanceof Error ? error.message : "Checkout failed";
    const clientMessage = /stock|quantity|unavailable|booking|total/i.test(message)
      ? message
      : "Checkout could not be completed";
    console.error("[checkout] failed", error);
    return NextResponse.json({ error: clientMessage }, { status: 502 });
  }
}
