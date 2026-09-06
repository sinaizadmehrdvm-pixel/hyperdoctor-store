# Versions 244–246 — Launch Site Surfaces

## Version 244 — Launch-ready global settings
- Upgrades `/admin/settings` with an explicit launch-readiness panel.
- Checks public phone, email, address and store logo without inventing fallback business data.
- Keeps all existing server/database validation for contact, social, locale, currency and timezone values.
- Adds direct shortcuts to live site and page/navigation management.

## Version 245 — CMS-aware global navigation and footer
- Header now consumes published `Page` records with `showInNav=true`, ordered by the existing CMS navigation order.
- Core commerce/service links remain safe fallbacks and duplicate core slugs are filtered.
- Mobile navigation receives the same CMS pages.
- Footer renders configured Instagram, Telegram and WhatsApp links and real contact settings.
- Footer and header continue to render safely when no optional settings are configured.

## Version 246 — Visual homepage publishing
- Root localized home routes (`/fa`, `/tr`, `/en`, `/ar`) now check the already-secured `public_page_builder('home')` publication.
- If a published visual-builder page with slug `home` exists, the root homepage renders that document directly.
- If it does not exist, the current production homepage remains the fallback with no visual or content regression.
- No page row, builder document, product, media or other synthetic Production data is created automatically.

## Launch safety
- No database migration is required by Versions 244–246.
- Version 243 Production cutover remains a prerequisite before deploying these changes to Production because `main` includes its strict RPC transport changes.
- Existing public homepage remains unchanged until an administrator explicitly creates and publishes a builder page with slug `home`.
