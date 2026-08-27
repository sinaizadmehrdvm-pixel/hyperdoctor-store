import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseRpc } from "@/lib/supabase-rest";

const schema = z.object({
  requestToken: z.string().uuid(),
  customerName: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(8).max(24),
  email: z.string().trim().email().max(254).optional().or(z.literal("")),
  department: z.string().trim().min(2).max(60),
  message: z.string().trim().min(10).max(3000),
  locale: z.enum(["fa", "tr", "en", "ar"]),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid contact payload" }, { status: 400 });
  }

  try {
    const body = parsed.data;
    const messageId = await supabaseRpc<string>("create_contact_message", {
      p_request_token: body.requestToken,
      p_customer_name: body.customerName,
      p_phone: body.phone,
      p_email: body.email || null,
      p_department: body.department,
      p_message: body.message,
      p_locale: body.locale,
    });
    return NextResponse.json({ ok: true, messageId });
  } catch (error) {
    console.error("[contact] create failed", error);
    return NextResponse.json({ error: "Message could not be registered" }, { status: 500 });
  }
}
