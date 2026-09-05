# Version 231 — Themes, Templates & Responsive Controls

Date: 2026-09-06

## Scope

Completes the next Lovable-style editor layer with reusable page templates, page-level design controls and responsive visibility behavior.

## Implemented

- Global page theme stored inside the builder document.
- Page background, surface, foreground, accent and muted colors.
- Global section gap, corner radius and font-scale controls.
- Published public renderer consumes the saved global theme.
- Reusable templates: Blank, Landing, Service, About and Campaign.
- Applying a template creates real editable builder sections and requires confirmation before replacing existing sections.
- Section-level background, foreground, vertical padding, max width, hero min-height, radius and alignment.
- Image position control for image-text sections.
- 2/3/4 column control for card sections.
- Per-section hide/show rules for Desktop, Tablet and Mobile.
- Card creation, deletion, localized copy and links from the inspector.
- Desktop/Tablet/Mobile canvas preview remains synchronized with responsive visibility.
- Existing draft/publish/revision workflow remains intact.

This phase is additive and does not publish or alter any existing page automatically.
