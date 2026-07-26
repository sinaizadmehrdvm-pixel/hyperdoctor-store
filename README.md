# Hyper Doctor Store

Bilingual (Persian/English) storefront for **Hyper Doctor** — the medical
equipment distribution and respiratory-services arm of **Vetrix Holding** —
with a self-serve admin panel for managing products, services, and pages.

This is an independent product with no code dependency on Vetrix's internal
ERP system.

## Stack

- **Next.js 16** (App Router, TypeScript) — public storefront + admin panel in one app
- **Tailwind CSS v4** + a small hand-rolled UI kit (buttons, badges, forms) in the spirit of shadcn/ui
- **Prisma 7** + SQLite (dev) via the `better-sqlite3` driver adapter — swap the datasource for Postgres in production without touching the schema
- **next-intl** — `/fa` (default, RTL) and `/en` (LTR) routing, self-hosted Vazirmatn + Inter fonts
- **Auth.js (NextAuth v5)** — credentials-based single-admin login for `/admin/*`
- **Tiptap** — WYSIWYG editor for CMS pages
- **Zarinpal** — payment gateway (sandbox by default; IDPay is a documented follow-up, not built yet)

## Getting Started

```bash
npm install
cp .env.example .env        # then edit values as needed
npx prisma migrate dev      # creates dev.db and applies the schema
npm run seed                # sample bilingual categories/products/services/pages + admin user
npm run dev
```

Visit `http://localhost:3000/fa` (or `/en`) for the storefront, and
`http://localhost:3000/admin/login` for the admin panel.

**Seeded admin login:** `admin@hyperdoctor.ir` / `HyperDoctor@2026`
— change this password (or create a new `AdminUser` and delete the seeded
one) before deploying anywhere reachable by the public.

## Environment Variables

See `.env.example` for the full list. Notable ones:

- `DATABASE_URL` — SQLite file path for dev; point at Postgres in production
- `AUTH_SECRET` — required by Auth.js; generate with `openssl rand -base64 32`
- `AUTH_TRUST_HOST` — keep `true` when self-hosting behind a reverse proxy or non-default port
- `ZARINPAL_SANDBOX` / `ZARINPAL_MERCHANT_ID` — set `ZARINPAL_SANDBOX=false` and a real merchant ID before going live
- `NEXT_PUBLIC_SITE_URL` — used to build the Zarinpal callback URL; must match your real deployment URL in production

## Brand Assets

The header/footer logo falls back to a placeholder mark until real files are
uploaded. To set the real Vetrix holding logo and Hyper Doctor logo, log into
`/admin/settings` and upload them there (stored as `SiteSetting.holdingLogoUrl`
/ `subBrandLogoUrl`) — no code changes needed.

## Data Model Notes

- `Category`, `Product`, and `Service` all carry a `vertical` field
  (`MEDICAL_EQUIPMENT`, `RESPIRATORY_SERVICES`, `DENTAL`, `VETERINARY`,
  `PHARMACY`, `NURSING`). Only the first two have real content today; the
  rest exist so future verticals can be added without a schema migration.
- Product prices are stored in **Toman**; the Zarinpal integration converts
  to Rial (×10) when calling their API, since that's what their API expects.
- CMS page slugs may not collide with the reserved top-level routes (`shop`,
  `product`, `services`, `cart`, `checkout`, `order`, `admin`, `api`) — the
  admin page form rejects those.

## Known v1 Limitations (documented, not silent gaps)

- **Single image per product/service.** The schema supports a full `Media`
  gallery, but the admin form only wires up one image today. Extending the
  form to multiple images is straightforward if needed.
- **Local disk media storage** (`public/uploads`). Fine for a single-server
  deployment; on ephemeral/serverless hosts (e.g. Vercel) this needs to move
  to object storage (S3-compatible) before uploads survive a redeploy.
- **IDPay is not implemented** — only Zarinpal. Add a second
  `PaymentGateway` implementation alongside `src/lib/payments/zarinpal.ts`
  when needed.
- **No automated tests yet.** Verified manually end-to-end (see below).
- `npm audit` reports a handful of high/moderate advisories, all in
  transitive dev-tooling (Prisma's dev CLI, Next's vendored PostCSS/Sharp
  copies) — not exploitable at runtime. Worth re-checking as dependencies
  update, but `npm audit fix --force` would downgrade Next/Prisma to
  ancient majors and should not be run blindly.

## Verification Performed

- `npm run build` passes (type-check + lint clean) with all storefront,
  admin, and API routes registered.
- Walked both locales end-to-end in a real browser: home → shop → category →
  product → add to cart → cart → checkout → order creation (re-priced
  server-side from the DB) → Zarinpal request → graceful `FAILED` state and
  error surfaced to the user when the gateway is unreachable.
- Logged into `/admin`, confirmed the dashboard, and created/edited a
  product, category, service, and bilingual CMS page through the UI.
