import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { sanitizeBuilderHref, sanitizeBuilderImageSrc, sanitizeRichTextHtml } from "../src/lib/page-builder-safety";

function mustContain(path: string, snippets: string[]) {
  const source = readFileSync(path, "utf8");
  for (const snippet of snippets) assert.ok(source.includes(snippet), `${path} is missing: ${snippet}`);
  return source;
}

assert.equal(sanitizeBuilderHref("/fa/products"), "/fa/products");
assert.equal(sanitizeBuilderHref("./about"), "./about");
assert.equal(sanitizeBuilderHref("#details"), "#details");
assert.equal(sanitizeBuilderHref("https://example.com/path?q=1"), "https://example.com/path?q=1");
assert.equal(sanitizeBuilderHref("mailto:hello@example.com"), "mailto:hello@example.com");
assert.equal(sanitizeBuilderHref("tel:+905551112233"), "tel:+905551112233");
assert.equal(sanitizeBuilderHref("javascript:alert(1)"), null);
assert.equal(sanitizeBuilderHref("jav&#x61;script:alert(1)"), null);
assert.equal(sanitizeBuilderHref("java&#115;cript:alert(1)"), null);
assert.equal(sanitizeBuilderHref("data:text/html,<script>alert(1)</script>"), null);
assert.equal(sanitizeBuilderHref("vbscript:msgbox(1)"), null);
assert.equal(sanitizeBuilderHref("//evil.example/path"), null);
assert.equal(sanitizeBuilderHref("https:\\evil.example"), null);
assert.equal(sanitizeBuilderHref(`https://example.com/${"a".repeat(2100)}`), null);
assert.doesNotThrow(() => sanitizeBuilderHref("&#999999999999999999999999;:x"));

assert.equal(sanitizeBuilderImageSrc("/images/hero.webp"), "/images/hero.webp");
assert.equal(sanitizeBuilderImageSrc("https://cdn.example.com/a.webp"), "https://cdn.example.com/a.webp");
assert.equal(sanitizeBuilderImageSrc("http://cdn.example.com/a.webp"), "http://cdn.example.com/a.webp");
assert.equal(sanitizeBuilderImageSrc("data:image/svg+xml,<svg onload=alert(1)>"), null);
assert.equal(sanitizeBuilderImageSrc("javascript:alert(1)"), null);
assert.equal(sanitizeBuilderImageSrc("mailto:image@example.com"), null);

const sanitized = sanitizeRichTextHtml('<p class="x" onclick="alert(1)">Hello <strong style="color:red">world</strong><img src=x onerror=alert(1)><script>alert(1)</script><a href="jav&#x61;script:alert(1)" target="_blank">bad</a><a href="https://example.com?a=1&amp;b=2" onclick="x">good</a></p>');
assert.ok(sanitized.includes("<p>Hello <strong>world</strong>"));
assert.ok(sanitized.includes("<a>bad</a>"));
assert.ok(sanitized.includes('<a href="https://example.com?a=1&amp;b=2" rel="noopener noreferrer">good</a>'));
assert.ok(!sanitized.includes("onclick"));
assert.ok(!sanitized.includes("onerror"));
assert.ok(!sanitized.includes("<img"));
assert.ok(!sanitized.includes("<script"));
assert.ok(!sanitized.includes("javascript:"));

mustContain("src/components/page-builder/section-renderer.tsx", [
  "sanitizeBuilderHref",
  "sanitizeBuilderImageSrc",
  "sanitizeRichTextHtml",
  "safeButtonHref",
  "safeCardHref",
]);

mustContain("src/app/admin/(protected)/editor/[id]/layout.tsx", [
  "currentAdminLocale",
  "Draft preview",
  "پیش‌نمایش پیش‌نویس",
  "Taslak önizleme",
  "معاينة المسودة",
]);

mustContain("src/app/admin/(protected)/editor/[id]/preview/page.tsx", [
  "safeToken",
  "latest saved draft",
  "آخرین پیش‌نویس ذخیره‌شده",
  "son kaydedilmiş taslağı",
  "آخر مسودة محفوظة",
]);

console.log("Version 284 visual editor audit passed: fail-closed rendering safety and localized draft-preview UX are present.");
