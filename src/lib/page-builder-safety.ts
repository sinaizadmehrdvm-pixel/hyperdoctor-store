const MAX_URL_LENGTH = 2048;
const CONTROL_CHARS = /[\u0000-\u001f\u007f-\u009f]/;
const ABSOLUTE_SCHEME = /^[a-z][a-z0-9+.-]*:/i;
const SAFE_HREF_SCHEMES = new Set(["http:", "https:", "mailto:", "tel:"]);
const SAFE_IMAGE_SCHEMES = new Set(["http:", "https:"]);
const SAFE_RICH_TEXT_TAGS = new Set([
  "p", "br", "strong", "b", "em", "i", "u", "s", "ul", "ol", "li", "blockquote",
  "h1", "h2", "h3", "h4", "h5", "h6", "pre", "code", "hr", "a", "span",
]);
const VOID_TAGS = new Set(["br", "hr"]);

function decodeCodePoint(value: string, radix: number) {
  const point = Number.parseInt(value, radix);
  return Number.isInteger(point) && point >= 0 && point <= 0x10ffff ? String.fromCodePoint(point) : "�";
}

function decodeUrlEntities(value: string) {
  return value
    .replace(/&#x([0-9a-f]+);?/gi, (_, hex: string) => decodeCodePoint(hex, 16))
    .replace(/&#([0-9]+);?/g, (_, decimal: string) => decodeCodePoint(decimal, 10))
    .replace(/&colon;?/gi, ":")
    .replace(/&tab;?/gi, "\t")
    .replace(/&newline;?/gi, "\n")
    .replace(/&amp;?/gi, "&")
    .replace(/&quot;?/gi, '"')
    .replace(/&apos;?/gi, "'");
}

function normalizeUrlInput(value: unknown) {
  if (typeof value !== "string") return null;
  const decoded = decodeUrlEntities(value).trim();
  if (!decoded || decoded.length > MAX_URL_LENGTH || CONTROL_CHARS.test(decoded) || decoded.includes("\\")) return null;
  return decoded;
}

function isSafeRelativeUrl(value: string) {
  return (
    (value.startsWith("/") && !value.startsWith("//")) ||
    value.startsWith("./") ||
    value.startsWith("../") ||
    value.startsWith("#") ||
    value.startsWith("?")
  );
}

export function sanitizeBuilderHref(value: unknown): string | null {
  const input = normalizeUrlInput(value);
  if (!input) return null;
  if (isSafeRelativeUrl(input)) return input;
  if (!ABSOLUTE_SCHEME.test(input)) return null;
  try {
    const parsed = new URL(input);
    return SAFE_HREF_SCHEMES.has(parsed.protocol.toLowerCase()) ? input : null;
  } catch {
    return null;
  }
}

export function sanitizeBuilderImageSrc(value: unknown): string | null {
  const input = normalizeUrlInput(value);
  if (!input) return null;
  if ((input.startsWith("/") && !input.startsWith("//")) || input.startsWith("./") || input.startsWith("../")) return input;
  if (!ABSOLUTE_SCHEME.test(input)) return null;
  try {
    const parsed = new URL(input);
    return SAFE_IMAGE_SCHEMES.has(parsed.protocol.toLowerCase()) ? input : null;
  } catch {
    return null;
  }
}

function escapeText(value: string) {
  return value.replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function escapeAttribute(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function extractHref(attributes: string) {
  const match = attributes.match(/\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/i);
  return match?.[1] ?? match?.[2] ?? match?.[3] ?? null;
}

function sanitizeTag(token: string) {
  if (/^<\s*!--/.test(token) || /^<\s*[!?]/.test(token)) return "";
  const match = token.match(/^<\s*(\/?)\s*([a-z0-9]+)\b([\s\S]*?)>$/i);
  if (!match) return escapeText(token);
  const closing = Boolean(match[1]);
  const tag = match[2].toLowerCase();
  const attributes = match[3] ?? "";
  if (!SAFE_RICH_TEXT_TAGS.has(tag)) return "";
  if (VOID_TAGS.has(tag)) return `<${tag}>`;
  if (closing) return `</${tag}>`;
  if (tag === "a") {
    const safeHref = sanitizeBuilderHref(extractHref(attributes));
    return safeHref ? `<a href="${escapeAttribute(safeHref)}" rel="noopener noreferrer">` : "<a>";
  }
  return `<${tag}>`;
}

export function sanitizeRichTextHtml(value: unknown) {
  if (typeof value !== "string" || !value) return "";
  let output = "";
  let cursor = 0;
  const tagPattern = /<[^>]*>/g;
  for (const match of value.matchAll(tagPattern)) {
    const index = match.index ?? 0;
    output += escapeText(value.slice(cursor, index));
    output += sanitizeTag(match[0]);
    cursor = index + match[0].length;
  }
  output += escapeText(value.slice(cursor));
  return output;
}
