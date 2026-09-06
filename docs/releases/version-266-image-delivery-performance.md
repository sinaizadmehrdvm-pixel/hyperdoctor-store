# Version 266 — Image Delivery & SEO Regression Guard

- Enables AVIF/WebP image negotiation and a one-day optimized image cache TTL in Next.js.
- Removes the framework powered-by response header.
- Adds `test:seo-index` to protect sitemap, robots, published-only SEO indexing, service-role-only grants and image-delivery configuration.
- Existing remote image compatibility is intentionally preserved for current catalog workflows; source verification remains enforced separately by ProductMediaEvidence.
