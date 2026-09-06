# Version 239 — Safe Page Clone

Adds a real one-click clone workflow for building variants quickly without risking the live site.

## Safety rules
- Requires a valid admin session and `SUPER_ADMIN` or `EDITOR` role.
- Creates a conflict-safe new slug (`-copy`, `-copy-2`, ...).
- Copies four-language legacy content, page template and the current Builder draft when one exists.
- The cloned page is always forced to `isPublished=false`, `showInNav=false`, `navOrder=0`.
- Published Builder state, published revision number and revision history are not copied.
- Pages management exposes a dedicated clone action that redirects directly into the cloned page's Visual Editor.

The migration does not clone any page by itself.
