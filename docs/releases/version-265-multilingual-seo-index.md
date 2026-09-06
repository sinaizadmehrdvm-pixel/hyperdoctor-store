# Version 265 — Multilingual SEO Index

- Adds a service-role-only `public_seo_index_v1` for published Products, Articles and CMS Pages.
- Adds a multilingual `/sitemap.xml` covering FA/TR/EN/AR static routes plus published product, article and page slugs.
- Adds `/robots.txt` that allows the public storefront while blocking Admin, API, Preview, account, cart, checkout and order-result paths from indexing.
- Draft/unpublished catalog content is never emitted into the SEO index.
- No catalog or commerce data is created by this migration.
