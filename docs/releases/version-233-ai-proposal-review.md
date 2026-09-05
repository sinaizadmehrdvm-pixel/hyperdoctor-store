# Version 233 — AI Proposal Review & Safe Apply

Date: 2026-09-06

## Scope

Integrates the AI engine directly into the visual editor while preserving the existing draft, revision, undo/redo and publish workflow.

## Implemented

- New AI button in the visual editor header.
- `Ctrl/Cmd + K` opens the AI assistant.
- AI assistant receives the current in-memory BuilderDocument, including unsaved editor changes.
- Page scope and selected-section scope.
- Proposal summary and server-computed change counts before apply.
- Full visual proposal preview using the public BuilderDocument renderer.
- Model identifier and token usage surfaced when returned by the gateway.
- Reject leaves the current document unchanged.
- Apply sends the validated proposal through the editor's existing `commit()` path.
- Applied AI changes therefore participate in Undo/Redo and the existing auto-save workflow.
- AI never publishes automatically.

This phase does not write production content by itself; only an authenticated editor accepting a proposal changes the draft.