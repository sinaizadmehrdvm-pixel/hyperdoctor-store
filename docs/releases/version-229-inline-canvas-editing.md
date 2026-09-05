# Version 229 — Inline Canvas Editing

Date: 2026-09-06

## Scope

Deepens the visual page builder so content can be edited directly on the rendered canvas, closer to the interaction model of modern visual builders.

## Implemented

- Direct inline editing for hero eyebrow/title/body/button text.
- Direct inline editing for rich-text sections.
- Direct inline editing for image-text title/body.
- Direct inline editing for cards title/body per card.
- Direct inline editing for CTA title/body/button.
- Canvas image replacement affordances for image-text and card images.
- Section selection remains synchronized with the inspector.
- Inline changes participate in Undo/Redo history.
- Keyboard shortcuts: Ctrl/Cmd+S, Ctrl/Cmd+Z, Ctrl/Cmd+Y / Shift+Cmd+Z, Escape.
- Unsaved-change protection and debounced auto-save.

No existing published page is modified automatically. Changes remain draft-only until explicitly published.
