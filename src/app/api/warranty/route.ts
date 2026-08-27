import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseRpc } from "@/lib/supabase-rest";
import { getCustomerToken } from "@/lib/customer-auth";

const schema = z.object({
  requestToken: z.string().uuid(),
  productId: z.string().min(1).max(160),
  serialNumber: z.string().trim().min(3).max(120),
  orderNumber: z.string().trim().max(80).optional().or(z.literal("")),
  purchaseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(8).max(24),
  email: z.string().trim().email().max(254).optional().or(z.literal("")),
  locale: z.enum(["fa", "tr", "en", "ar"]),
});

type RegisteredWarranty = {
  id: string;
  serialNumber: string;
  publicToken: string;
  status: string;
  startsAt: string;
  expiresAt: string;
  productName?: string;
};

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid warranty payload" }, { status: 400 });
  try {
    const body = parsed.data;
    const warranty = await supabaseRpc<RegisteredWarranty>("register_guest_warranty", {
      p_request_token: body.requestToken,
      p_product_id: body.productId,
      p_serial_number: body.serialNumber,
      p_order_number: body.orderNumber || "",
      p_purchase_date: body.purchaseDate,
      p_name: body.name,
      p_phone: body.phone,
      p_email: body.email || null,
      p_locale: body.locale,
    });

    const customerToken = await getCustomerToken();
    if (customerToken && warranty.publicToken) {
      await supabaseRpc<boolean>("attach_warranty_customer", {
        p_public_token: warranty.publicToken,
        p_customer_token: customerToken,
      }).catch(() => false);
    }

    return NextResponse.json({ ok: true, ...warranty });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Warranty registration failed";
    console.error("[warranty] registration failed", error);
    return NextResponse.json({ error: /serial|warranty|product|purchase/i.test(message) ? message : "Warranty registration failed" }, { status: 409 });
  }
}
