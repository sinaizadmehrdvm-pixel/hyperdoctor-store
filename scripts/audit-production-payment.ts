import fs from "node:fs";

const z=fs.readFileSync("src/lib/payments/zarinpal.ts","utf8");
const h=fs.readFileSync("src/app/api/health/route.ts","utf8");
const required=[
  "SANDBOX_REQUESTED",
  "const SANDBOX = IS_PRODUCTION ? false : SANDBOX_REQUESTED",
  "MERCHANT_NOT_CONFIGURED",
  "PRODUCTION_SITE_URL_INVALID",
  "PLACEHOLDER_MERCHANT_IDS",
  "assertPaymentRuntimeReady",
  "getZarinpalRuntimeStatus"
];
for(const token of required){if(!z.includes(token))throw new Error(`payment hardening token missing: ${token}`)}
if(z.includes('blockers.push("SANDBOX_ENABLED_IN_PRODUCTION")'))throw new Error("production is still blocked by stale sandbox environment state");
if(!z.includes('https://payment.zarinpal.com/pg/v4/payment'))throw new Error("live payment endpoint missing");
if(!h.includes("getZarinpalRuntimeStatus"))throw new Error("health probe does not include payment readiness");
if(!h.includes("status:ok?200:503"))throw new Error("health probe does not fail closed for merchant/site readiness");
console.log("production payment hardening audit passed: production gateway locked live");
