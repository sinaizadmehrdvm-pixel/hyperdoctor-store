const IS_PRODUCTION = process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production";
const SANDBOX = process.env.ZARINPAL_SANDBOX !== "false";
const MERCHANT_ID = (process.env.ZARINPAL_MERCHANT_ID ?? "").trim();
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").trim();
const PLACEHOLDER_MERCHANT_IDS = new Set(["00000000-0000-0000-0000-000000000000"]);
const API_BASE = SANDBOX
  ? "https://sandbox.zarinpal.com/pg/v4/payment"
  : "https://payment.zarinpal.com/pg/v4/payment";
const STARTPAY_BASE = SANDBOX
  ? "https://sandbox.zarinpal.com/pg/StartPay"
  : "https://payment.zarinpal.com/pg/StartPay";
const TIMEOUT_MS = 12_000;

type GatewayResponse = {
  data?: { authority?: unknown; code?: unknown; ref_id?: unknown };
};

export type ZarinpalVerification =
  | { status: "verified"; refId: string }
  | { status: "rejected" }
  | { status: "unavailable" };

export type ZarinpalRuntimeStatus = {
  ready: boolean;
  production: boolean;
  sandbox: boolean;
  merchantConfigured: boolean;
  siteUrlValid: boolean;
  blockers: string[];
};

function isValidProductionSiteUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname !== "localhost" && url.hostname !== "127.0.0.1";
  } catch {
    return false;
  }
}

function merchantConfigured() {
  return MERCHANT_ID.length > 0 && !PLACEHOLDER_MERCHANT_IDS.has(MERCHANT_ID);
}

export function getZarinpalRuntimeStatus(): ZarinpalRuntimeStatus {
  const blockers: string[] = [];
  const merchantOk = merchantConfigured();
  const siteUrlValid = !IS_PRODUCTION || isValidProductionSiteUrl(SITE_URL);

  if (!merchantOk) blockers.push("MERCHANT_NOT_CONFIGURED");
  if (IS_PRODUCTION && SANDBOX) blockers.push("SANDBOX_ENABLED_IN_PRODUCTION");
  if (!siteUrlValid) blockers.push("PRODUCTION_SITE_URL_INVALID");

  return {
    ready: blockers.length === 0,
    production: IS_PRODUCTION,
    sandbox: SANDBOX,
    merchantConfigured: merchantOk,
    siteUrlValid,
    blockers,
  };
}

function assertPaymentRuntimeReady() {
  const status = getZarinpalRuntimeStatus();
  if (!status.ready) throw new Error(`Zarinpal runtime is not ready: ${status.blockers.join(",")}`);
}

function tomanToRial(amountToman: number) {
  if (
    !Number.isSafeInteger(amountToman) ||
    amountToman <= 0 ||
    amountToman > Number.MAX_SAFE_INTEGER / 10
  ) {
    throw new Error("Invalid payment amount");
  }
  return amountToman * 10;
}

async function postJson(path: string, body: unknown): Promise<GatewayResponse> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(`${API_BASE}/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
      cache: "no-store",
    });
    const text = await response.text();
    let data: unknown;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      throw new Error("Invalid payment gateway response");
    }
    if (!response.ok) throw new Error(`Payment gateway HTTP ${response.status}`);
    if (!data || typeof data !== "object") throw new Error("Invalid payment gateway response");
    return data as GatewayResponse;
  } finally {
    clearTimeout(timer);
  }
}

function safeText(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export function getZarinpalStartPayUrl(authorityValue: unknown) {
  const authority = safeText(authorityValue, 128);
  if (authority.length < 5) throw new Error("Invalid payment authority");
  return `${STARTPAY_BASE}/${encodeURIComponent(authority)}`;
}

export async function requestZarinpalPayment(opts: {
  amountToman: number;
  description: string;
  orderNumber: string;
  checkoutToken: string;
  mobile?: string;
  email?: string;
}): Promise<{ authority: string; redirectUrl: string }> {
  assertPaymentRuntimeReady();
  const amount = tomanToRial(opts.amountToman);
  const callback = new URL(`${SITE_URL}/api/payments/zarinpal/callback`);
  callback.searchParams.set("order", safeText(opts.orderNumber, 160));
  callback.searchParams.set("ct", safeText(opts.checkoutToken, 256));

  const data = await postJson("request.json", {
    merchant_id: MERCHANT_ID,
    amount,
    description: safeText(opts.description, 255),
    callback_url: callback.toString(),
    metadata: {
      mobile: safeText(opts.mobile, 24) || undefined,
      email: safeText(opts.email, 254) || undefined,
    },
  });

  const authority = safeText(data.data?.authority, 128);
  const code = Number(data.data?.code);
  if (!authority || code !== 100) throw new Error("Payment gateway rejected payment request");
  return { authority, redirectUrl: getZarinpalStartPayUrl(authority) };
}

export async function verifyZarinpalPayment(opts: {
  amountToman: number;
  authority: string;
}): Promise<ZarinpalVerification> {
  if (!getZarinpalRuntimeStatus().ready) return { status: "unavailable" };
  const authority = safeText(opts.authority, 128);
  if (!authority) return { status: "rejected" };

  let amount: number;
  try {
    amount = tomanToRial(opts.amountToman);
  } catch {
    return { status: "rejected" };
  }

  try {
    const data = await postJson("verify.json", { merchant_id: MERCHANT_ID, amount, authority });
    const code = Number(data.data?.code);
    if (code !== 100 && code !== 101) return { status: "rejected" };
    const refId = safeText(data.data?.ref_id == null ? "" : String(data.data.ref_id), 128);
    if (!refId) return { status: "unavailable" };
    return { status: "verified", refId };
  } catch (error) {
    console.error("[zarinpal] verification unavailable", error);
    return { status: "unavailable" };
  }
}
