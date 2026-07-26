export function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9؀-ۿ\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
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
