const SANDBOX = process.env.ZARINPAL_SANDBOX !== "false";
const MERCHANT_ID = process.env.ZARINPAL_MERCHANT_ID ?? "";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const API_BASE = SANDBOX
  ? "https://sandbox.zarinpal.com/pg/v4/payment"
  : "https://payment.zarinpal.com/pg/v4/payment";
const STARTPAY_BASE = SANDBOX
  ? "https://sandbox.zarinpal.com/pg/StartPay"
  : "https://payment.zarinpal.com/pg/StartPay";

/** Order amounts are stored in Toman; Zarinpal's API expects Rial. */
function tomanToRial(amountToman: number) {
  return amountToman * 10;
}

export async function requestZarinpalPayment(opts: {
  amountToman: number;
  description: string;
  orderNumber: string;
  mobile?: string;
  email?: string;
}): Promise<{ authority: string; redirectUrl: string }> {
  const response = await fetch(`${API_BASE}/request.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      merchant_id: MERCHANT_ID,
      amount: tomanToRial(opts.amountToman),
      description: opts.description,
      callback_url: `${SITE_URL}/api/payments/zarinpal/callback?order=${opts.orderNumber}`,
      metadata: { mobile: opts.mobile, email: opts.email },
    }),
  });

  const data = await response.json();
  const authority: string | undefined = data?.data?.authority;
  const code: number | undefined = data?.data?.code;

  if (!authority || code !== 100) {
    throw new Error(
      `Zarinpal payment request failed: ${JSON.stringify(data?.errors ?? data)}`
    );
  }

  return { authority, redirectUrl: `${STARTPAY_BASE}/${authority}` };
}

export async function verifyZarinpalPayment(opts: {
  amountToman: number;
  authority: string;
}): Promise<{ success: boolean; refId?: string }> {
  const response = await fetch(`${API_BASE}/verify.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      merchant_id: MERCHANT_ID,
      amount: tomanToRial(opts.amountToman),
      authority: opts.authority,
    }),
  });

  const data = await response.json();
  const code: number | undefined = data?.data?.code;
  // 100 = verified now, 101 = already verified previously — both are success
  if (code === 100 || code === 101) {
    return { success: true, refId: String(data.data.ref_id) };
  }
  return { success: false };
}
