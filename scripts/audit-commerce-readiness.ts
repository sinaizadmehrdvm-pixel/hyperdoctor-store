import { readFileSync } from "node:fs";

function mustInclude(file:string,needles:string[]){const text=readFileSync(file,"utf8");for(const needle of needles){if(!text.includes(needle))throw new Error(`${file}: missing commerce guard ${needle}`)}}

mustInclude("supabase/migrations/20260906181500_product_commerce_readiness_and_checkout_gate.sql",[
  "admin_product_commerce_readiness",
  "IMAGE_UNAVAILABLE",
  "public_validate_cart_v1",
  "v_preflight:=public.public_validate_cart_v1",
  "cart validation failed",
]);
mustInclude("supabase/migrations/20260906190000_production_commerce_control_center.sql",[
  "admin_commerce_control_center",
  "NO_SELLABLE_VARIANT",
  "PRICE_MISSING",
  "STOCK_MISSING",
  "to service_role",
]);
mustInclude("src/components/site/add-to-cart-button.tsx",[
  "missingProductImage",
  "missingPrice",
  "paymentGateway===\"ZARINPAL\"",
  "currency===\"IRT\"",
  "Checkout is not available for this branch",
]);
mustInclude("src/components/site/shop-product-card.tsx",[
  "storeCheckoutEnabled",
  "checkoutEnabled",
  "Checkout is not available for this branch",
]);
mustInclude("src/lib/store-inventory.ts",[
  "storeCheckoutEnabled",
  "paymentGateway===\"ZARINPAL\"",
  "currency===\"IRT\"",
]);
mustInclude("src/app/admin/(protected)/products/[id]/page.tsx",[
  "admin_product_commerce_readiness",
  "saleReadyAnyBranch",
  "checkoutReadyAnyBranch",
]);
mustInclude("src/app/admin/(protected)/commerce/page.tsx",[
  "admin_commerce_control_center",
  "admin_warehouse_inventory",
  "saveBranchPrice",
  "saveWarehouseStock",
]);
console.log("Commerce readiness audit passed: catalog, branch pricing, warehouse stock and checkout-state guards are wired");
