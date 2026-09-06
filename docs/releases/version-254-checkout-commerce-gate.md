# Version 254 — Authoritative Checkout Commerce Gate

## Goal

Guarantee server-side that incomplete catalog products cannot become payable orders even if a client bypasses storefront controls.

## Cart validation

`public_validate_cart_v1` now rejects a product line with `IMAGE_UNAVAILABLE` when the published product has no registered image. Existing branch-aware price, inventory, quantity and variant checks remain in place.

## Order creation

`create_guest_order_v4` now performs a fresh authoritative `public_validate_cart_v1` preflight inside the order transaction before calling the reservation/order creation path. It refuses order creation when checkout is disabled or any line is invalid.

The existing safeguards remain:

- branch must be published and sales-enabled;
- payment gateway must be ZARINPAL;
- currency must be IRT;
- price snapshot is recalculated from active branch price sources;
- total must remain positive and within integer bounds;
- warehouse reservation logic remains authoritative.

## Defense in depth

The final sale gate therefore exists at three levels:

1. storefront Add-to-Cart UX;
2. cart validation RPC;
3. transactional order creation preflight.

The CI commerce-readiness audit verifies that these guards stay wired in future changes.

## Data safety

No order, payment, inventory, product, price or media rows are created by this release or migration.