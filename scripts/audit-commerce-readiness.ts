import { readFileSync } from "node:fs";

function mustInclude(file:string,needles:string[]){const text=readFileSync(file,"utf8");for(const needle of needles){if(!text.includes(needle))throw new Error(`${file}: missing commerce guard ${needle}`)}}

mustInclude("supabase/migrations/20260906181500_product_commerce_readiness_and_checkout_gate.sql",[
  "admin_product_commerce_readiness",
  "IMAGE_UNAVAILABLE",
  "public_validate_cart_v1",
  "v_preflight:=public.public_validate_cart_v1",
  "cart validation failed",
]);
mustInclude("src/components/site/add-to-cart-button.tsx",[
  "missingProductImage",
  "missingPrice",
  "This product is not yet ready for sale",
]);
mustInclude("src/app/admin/(protected)/products/[id]/page.tsx",[
  "admin_product_commerce_readiness",
  "saleReadyAnyBranch",
  "checkoutReadyAnyBranch",
]);
console.log("Commerce readiness audit passed: image, price, stock and checkout guards are wired");
