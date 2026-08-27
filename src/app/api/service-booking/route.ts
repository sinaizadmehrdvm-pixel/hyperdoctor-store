import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseRpc } from "@/lib/supabase-rest";
import { getCustomerToken } from "@/lib/customer-auth";

const schema = z.object({
  requestToken: z.string().uuid(),
  serviceId: z.string().min(1).max(120),
  customerName: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(8).max(24),
  email: z.string().trim().email().max(254).optional().or(z.literal("")),
  preferredDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  preferredTime: z.string().trim().min(3).max(40),
  address: z.string().trim().max(700).optional().or(z.literal("")),
  notes: z.string().trim().max(1200).optional().or(z.literal("")),
  locale: z.enum(["fa", "tr", "en", "ar"]),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid booking payload" }, { status: 400 });

  const body = parsed.data;
  const requested = new Date(`${body.preferredDate}T12:00:00Z`);
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  if (Number.isNaN(requested.getTime()) || requested < today) return NextResponse.json({ error: "Invalid booking date" }, { status: 400 });

  try {
    const bookingId = await supabaseRpc<string>("create_service_booking", {
      p_request_token: body.requestToken,
      p_service_id: body.serviceId,
      p_customer_name: body.customerName,
      p_phone: body.phone,
      p_email: body.email || null,
      p_preferred_date: body.preferredDate,
      p_preferred_time: body.preferredTime,
      p_address: body.address || null,
      p_notes: body.notes || null,
      p_locale: body.locale,
    });

    const customerToken = await getCustomerToken();
    if (customerToken) {
      await supabaseRpc<boolean>("attach_booking_customer", {
        p_request_token: body.requestToken,
        p_customer_token: customerToken,
      }).catch(() => false);
    }

    return NextResponse.json({ bookingId, ok: true });
  } catch (error) {
    console.error("[service-booking] create failed", error);
    return NextResponse.json({ error: "Booking could not be registered" }, { status: 500 });
  }
}
