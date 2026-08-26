# Hyper Doctor Unified Integration — Source Map

Status: active integration branch `integration/final-hyperdoctor`

## Canonical target

`hyperdoctor-store` is the production base because it already combines the public storefront and admin panel in one Next.js 16 application with bilingual `/fa` and `/en` routing, SQLite/Prisma persistence, Auth.js admin protection, CMS pages, products/services, and media support.

## Sources to merge

### 1. hyperdoctor-store — production base
Keep and extend:
- Next.js 16 App Router
- bilingual routing and RTL/LTR behavior
- Auth.js admin boundary
- Prisma/SQLite data model
- product/service/page admin CRUD
- payment/store infrastructure unless explicitly disabled for launch
- existing Vazirmatn + Inter font foundation

### 2. hyper-builder — visual editing capability donor
Port selectively, not as a second app:
- section/block editor concepts
- drag/drop ordering (`@dnd-kit`)
- interactive frame/section editing where useful
- media library interaction patterns

Do not port unrelated order/customer/site-builder multi-tenant APIs wholesale.

### 3. Stitch `stitch_hybrid_shop_and_services*.zip` files — visual/UI specification
Each inspected package contains:
- `screen.png`
- `code.html`
- `DESIGN.md`

The common design language is the Vitalis MedTech / Hyper Doctor medical system:
- deep medical blue primary
- medical red secondary
- oxygen blue tertiary
- cool clinical surfaces
- 8px spacing rhythm
- rounded 8–16px controls/cards
- glass/tonal depth
- RTL/LTR-ready layouts

Use the screenshots/HTML as visual specifications, not as production HTML to paste verbatim.

### 4. hyperdoctor-new — legacy/public visual/content donor
Use only when it contains a stronger existing public-site treatment or local image/assets worth preserving. Do not inherit its duplicated project structure or committed `node_modules`.

## Typography decision

Public/admin Persian: Vazirmatn.
Public/admin English/Latin: Inter.
Technical/tabular labels: mono only where it improves data readability.

The Stitch design names Hanken Grotesk/Noto Sans, but the requested project direction and existing production foundation favor Vazirmatn + Inter; preserve the Stitch density/weights/spacing rather than adding unnecessary font families.

## Required end-state

One application must provide:
- public bilingual site for `hyperdoctor.ir`
- product catalog and product detail pages
- multi-image product gallery/slider
- admin login and protected dashboard
- product/media management
- page/section management
- add/remove/edit/reorder sections
- per-section background image
- draft/published content state
- safe local persistent media storage for VPS deployment
- contact details and production-domain SEO configuration

## Integration rule

Prefer existing production capability over rebuilding it. Port only missing capabilities. All admin-managed content/media must be validated server-side and public rendering must consume sanitized published data only.
