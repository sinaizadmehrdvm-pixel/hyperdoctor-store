import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseRpc } from "@/lib/supabase-rest";
import { getCustomerToken } from "@/lib/customer-auth";

const schema = z.object({
  requestToken: z.string().uuid(),
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(8).max(24),
  email: z.string().trim().email().max(254).optional().or(z.literal("")),
  subject: z.string().trim().min(4).max(180),
  category: z.string().trim().min(2).max(60),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]),
  deviceInfo: z.string().trim().max(500).optional().or(z.literal("")),
  message: z.string().trim().min(10).max(4000),
  locale: z.enum(["fa", "tr", "en", "ar"]),
});

type TicketCreated = { ticketNo: string; publicToken: string; status: string };

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid support payload" }, { status: 400 });
  try {
    const body = parsed.data;
    const ticket = await supabaseRpc<TicketCreated>("create_guest_support_ticket", {
      p_request_token: body.requestToken,
      p_name: body.name,
      p_phone: body.phone,
      p_email: body.email || null,
      p_subject: body.subject,
      p_category: body.category,
      p_priority: body.priority,
      p_device_info: body.deviceInfo || null,
      p_message: body.message,
      p_locale: body.locale,
    });

    const customerToken = await getCustomerToken();
    if (customerToken && ticket.publicToken) {
      await supabaseRpc<boolean>("attach_support_customer", {
        p_public_token: ticket.publicToken,
        p_customer_token: customerToken,
      }).catch(() => false);
    }

    return NextResponse.json({ ok: true, ...ticket });
  } catch (error) {
    console.error("[support] create failed", error);
    return NextResponse.json({ error: "Support ticket could not be registered" }, { status: 500 });
  }
}
