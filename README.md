# Hyper Doctor Store

Production storefront and operations platform for **Hyper Doctor**, the medical-equipment and respiratory-services brand under **VITALIS Group**.

The application combines a four-language public storefront, customer workflows, and a protected admin panel for products, services, orders, inventory, content, support, warranties, reports, customers, discounts, media, banners, and site settings.

## Languages

The application supports:

- Persian (`fa`, RTL)
- Arabic (`ar`, RTL)
- English (`en`, LTR)
- Turkish (`tr`, LTR)

Public and admin interfaces are designed to switch both language and text direction correctly.

## Stack

- **Next.js 16** (App Router, TypeScript)
- **Tailwind CSS v4**
- **Supabase / PostgreSQL** for production data and RPC-backed workflows
- **Prisma** for compatible database-backed application areas
- **next-intl** for localized public routing
- **Tiptap** for rich-text content editing
- **Vercel** for production deployment

## Production Data Model

The production application includes data and workflows for:

- Products, categories, pricing, publication state and inventory
- Orders and payment records
- Customers and customer sessions
- Service bookings
- Support tickets and replies
- Warranty registrations and events
- Coupons and discount usage
- CMS pages, articles, banners and media
- Site settings and navigation
- Admin authentication and protected admin operations

Product prices are stored in Toman where applicable.

## Admin Security

Admin access is protected by server-side session validation. No production credentials are stored in this repository or documented here.

Never commit passwords, API keys, Supabase secrets, payment credentials, or production connection strings. Configure production secrets only through the deployment environment.

## Deployment

The `main` branch is the production source branch. Vercel builds and deploys production from this repository.

Before considering a release complete:

1. Confirm the latest `main` commit is the commit deployed to production.
2. Confirm the Vercel build is `READY`.
3. Check production runtime errors.
4. Smoke-test Persian, Arabic, English and Turkish routes.
5. Smoke-test admin login and critical admin sections.
6. Verify database-backed actions such as inventory, orders, content and settings.

## Current QA Focus

Current release work prioritizes:

- Four-language parity across public, account and admin interfaces
- Correct RTL/LTR behavior
- Production-safe Supabase RPC behavior
- Stable Vercel builds and runtime
- Real database-backed admin operations
- Removal of stale VETRIX naming in favor of VITALIS Group

## Local Development

Use the environment template as the reference for required local variables:

```bash
npm install
cp .env.example .env
npm run dev
```

Do not copy production secrets into source-controlled files.
