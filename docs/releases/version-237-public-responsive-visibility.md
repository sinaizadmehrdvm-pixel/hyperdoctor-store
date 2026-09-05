# Version 237 — Public Responsive Visibility Parity

Date: 2026-09-06

## Implemented

- Public visual-builder rendering now respects section `hiddenOn` rules at actual CSS breakpoints.
- Mobile-only hiding uses the mobile range, tablet-only hiding uses the tablet range, and desktop-only hiding uses the desktop range.
- Editor device previews continue using explicit Desktop/Tablet/Mobile viewport simulation.
- A section hidden on desktop no longer disappears from every public viewport.
- Existing section content and published documents are unchanged; this is renderer behavior only.
