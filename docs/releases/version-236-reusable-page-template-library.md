# Version 236 — Reusable Page Template Library

Date: 2026-09-06

## Implemented

- Persistent reusable visual-builder page templates in Supabase.
- Save the current page draft as a named reusable template.
- Optional template description and section count visibility.
- Apply a saved template to another page as draft-only content.
- Delete obsolete templates.
- Editor/Super Admin authorization enforced in both application RBAC and database RPCs.
- Applying a template never publishes automatically.

The additive Production migration was applied with zero template rows created automatically.