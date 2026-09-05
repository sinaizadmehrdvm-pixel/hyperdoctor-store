# Version 232 — Production AI Editor Engine

Date: 2026-09-06

## Scope

Adds a real authenticated AI transformation engine for the visual page builder. It does not generate fake/local suggestions and does not automatically save or publish model output.

## Implemented

- New authenticated route: `POST /api/admin/editor-ai`.
- Access restricted to `SUPER_ADMIN` and `EDITOR` sessions.
- Vercel AI Gateway transport using `AI_GATEWAY_API_KEY` or deployment-provided `VERCEL_OIDC_TOKEN`.
- Primary model: `openai/gpt-5.6-sol` with gateway fallbacks.
- 45-second server timeout and explicit gateway/error states.
- Strict Zod validation for incoming BuilderDocument and AI-produced BuilderDocument.
- Maximum limits for sections, cards, localized text and URLs.
- Section-scope enforcement on the server: non-selected sections and the global theme cannot be altered by a section-only AI request.
- AI output must be JSON and is rejected if it cannot be parsed or fails the document schema.
- Diff metadata is computed server-side before returning the proposal.
- System instructions prohibit invented product prices, certifications, warranty terms, clinical claims, device specifications and regulatory approvals.
- Scripts, executable URLs and fabricated image URLs are forbidden in the model contract.

No page content is modified until an authenticated editor explicitly accepts a proposal in the client.