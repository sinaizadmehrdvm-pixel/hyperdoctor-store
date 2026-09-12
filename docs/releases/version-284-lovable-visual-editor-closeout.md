# Version 284 — Lovable-grade Visual Editor Closeout

Date: 2026-09-12

## Goal

Close the remaining editor experience and rendering-safety gaps without changing catalog, commerce, inventory, payment, or publication state.

## Existing capabilities retained

The release builds on the already shipped Visual Page Builder foundation and keeps all existing behavior intact:

- full-screen visual canvas;
- section add/delete/duplicate/reorder and drag/drop;
- inline text editing;
- media replacement;
- desktop/tablet/mobile simulation;
- FA/TR/EN/AR localized content editing with RTL/LTR handling;
- undo/redo and autosave;
- explicit Save Draft and Publish separation;
- revision history and restore;
- reusable blocks and templates;
- secure token-gated draft preview;
- deterministic pre-publish quality gate.

## Version 284 changes

### 1. Fail-closed rendering safety

A dedicated `page-builder-safety` layer now protects every Builder render path, including public pages and secure draft previews.

- Button/card links only accept explicitly supported internal/HTTP(S)/mailto/tel targets.
- Image sources only accept local or HTTP(S) sources.
- `javascript:`, `data:`, `vbscript:`, protocol-relative, backslash-obfuscated and control-character URL forms fail closed.
- Numeric and common named HTML entities are decoded before URL-scheme validation to stop entity-obfuscated executable schemes.
- Rich-text HTML is rebuilt from a small allowlist of formatting tags.
- Event handlers, arbitrary attributes, scripts, images, iframes and unsupported tags are not rendered from rich text.
- Safe anchors are rebuilt with a sanitized href and `rel="noopener noreferrer"`.

No third-party sanitizer dependency is introduced.

### 2. Draft Preview UX clarification

The persistent editor tools dock now labels the action explicitly as **Draft Preview**, instead of leaving the relationship between Live Site and Draft Preview ambiguous.

The tools dock is localized in Persian, Turkish, English and Arabic, and the Draft Preview action receives a stronger visual treatment.

### 3. Four-language preview manager

The secure preview manager is now fully localized for FA/TR/EN/AR and:

- clearly states that it renders only the latest saved draft;
- clearly states that preview creation never publishes;
- preserves token expiry/revoke controls;
- validates the returned preview token format before generating preview links;
- localizes duration, state and timestamp labels.

### 4. Deterministic release audit

`npm run test:visual-editor` verifies:

- allowed and blocked link schemes;
- encoded executable-scheme bypass attempts;
- image-source restrictions;
- rich-text attribute/tag stripping;
- safe anchor reconstruction;
- presence of the render-safety layer in the Section Renderer;
- localized Draft Preview UX in all four supported languages.

The audit is part of the main CI workflow and has a dedicated Version 284 workflow.

## Data and publication safety

Version 284 adds no Supabase migration and performs no data mutation by itself.

It does **not**:

- publish any page;
- alter any existing Builder draft or published document;
- create preview tokens automatically;
- change products, prices, inventory, branch commerce, payments or catalog publication state.

Publishing remains an explicit editor action and continues to pass through the existing database-enforced quality gate.

## Release gate

Merge only when both the repository CI and the dedicated Version 284 Visual Editor audit are green. After merge, verify the Production deployment, health endpoint, public storefront and authenticated editor/preview routes before declaring the release complete.
