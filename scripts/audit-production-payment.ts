import fs from "node:fs";

const z=fs.readFileSync("src/lib/payments/zarinpal.ts","utf8");
const h=fs.readFileSync("src/app/api/health/route.ts","utf8");
const required=[
  "SANDBOX_ENABLED_IN_PRODUCTION",
  "MERCHANT_NOT_CONFIGURED",
  "PRODUCTION_SITE_URL_INVALID",
  "PLACEHOLDER_MERCHANT_IDS",
  "assertPaymentRuntimeReady",
  "getZarinpalRuntimeStatus"
];
for(const token of required){if(!z.includes(token))throw new Error(`payment hardening token missing: ${token}`)}
if(!h.includes("getZarinpalRuntimeStatus"))throw new Error("health probe does not include payment readiness");
if(!h.includes("status:ok?200:503"))throw new Error("health probe does not fail closed for production payment readiness");
console.log("production payment hardening audit passed");
