const NON_SLUG_CHARS = /[^a-z0-9؀-ۿ\s-]/g;
const VALID_SLUG = /^[a-z0-9؀-ۿ]+(?:-[a-z0-9؀-ۿ]+)*$/;

export function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(NON_SLUG_CHARS, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function isValidSlug(input: string) {
  return input.length > 0 && input.length <= 180 && VALID_SLUG.test(input);
}

export const RESERVED_SLUGS = new Set([
  "shop",
  "product",
  "services",
  "cart",
  "checkout",
  "order",
  "admin",
  "api",
]);
