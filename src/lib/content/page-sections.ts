export const PAGE_SECTION_TYPES = [
  "hero",
  "richText",
  "featureGrid",
  "cta",
  "gallery",
  "productGrid",
  "serviceGrid",
  "contact",
] as const;

export type PageSectionType = (typeof PAGE_SECTION_TYPES)[number];
export type PageSectionStatus = "DRAFT" | "PUBLISHED";

export interface RawPageSection {
  id: string;
  type: string;
  sortOrder: number;
  enabled: boolean;
  status: string;
  titleFa: string;
  titleEn: string;
  bodyFa: string;
  bodyEn: string;
  ctaLabelFa: string;
  ctaLabelEn: string;
  ctaHref: string;
  backgroundUrl: string;
  backgroundAltFa: string;
  backgroundAltEn: string;
  settings: string;
}

export interface PublicPageSection {
  id: string;
  type: PageSectionType;
  sortOrder: number;
  title: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
  backgroundUrl: string;
  backgroundAlt: string;
  settings: Record<string, unknown>;
}

export interface PageSectionValidationIssue {
  sectionId: string;
  field: string;
  message: string;
}

export function isPageSectionType(value: string): value is PageSectionType {
  return (PAGE_SECTION_TYPES as readonly string[]).includes(value);
}

function parseSettings(value: string): Record<string, unknown> | null {
  try {
    const parsed: unknown = JSON.parse(value || "{}");
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function validatePageSections(sections: RawPageSection[]): PageSectionValidationIssue[] {
  const issues: PageSectionValidationIssue[] = [];
  const ids = new Set<string>();
  const orders = new Set<number>();

  for (const section of sections) {
    if (ids.has(section.id)) {
      issues.push({ sectionId: section.id, field: "id", message: "Duplicate section id." });
    }
    ids.add(section.id);

    if (orders.has(section.sortOrder)) {
      issues.push({ sectionId: section.id, field: "sortOrder", message: "Duplicate section order." });
    }
    orders.add(section.sortOrder);

    if (!isPageSectionType(section.type)) {
      issues.push({ sectionId: section.id, field: "type", message: "Unsupported section type." });
    }

    if (section.status !== "DRAFT" && section.status !== "PUBLISHED") {
      issues.push({ sectionId: section.id, field: "status", message: "Unsupported section status." });
    }

    if (section.type === "hero" && (!section.titleFa.trim() || !section.titleEn.trim())) {
      issues.push({ sectionId: section.id, field: "title", message: "Hero requires bilingual titles." });
    }

    const hasCtaData = Boolean(section.ctaLabelFa || section.ctaLabelEn || section.ctaHref);
    if (
      hasCtaData &&
      (!section.ctaLabelFa.trim() || !section.ctaLabelEn.trim() || !section.ctaHref.trim())
    ) {
      issues.push({ sectionId: section.id, field: "cta", message: "CTA requires fa/en labels and href." });
    }

    if (section.ctaHref && !section.ctaHref.startsWith("/") && !section.ctaHref.startsWith("#") && !section.ctaHref.startsWith("http")) {
      issues.push({ sectionId: section.id, field: "ctaHref", message: "CTA href must be an internal path, anchor, or absolute URL." });
    }

    if (parseSettings(section.settings) === null) {
      issues.push({ sectionId: section.id, field: "settings", message: "Section settings must be a JSON object." });
    }
  }

  return issues;
}

export function toPublicPageSections(
  sections: RawPageSection[],
  locale: "fa" | "en",
): PublicPageSection[] {
  const issues = validatePageSections(sections);
  if (issues.length > 0) {
    throw new Error(`Invalid page section dataset: ${issues.map((issue) => `${issue.sectionId}.${issue.field}`).join(", ")}`);
  }

  return [...sections]
    .filter((section) => section.enabled && section.status === "PUBLISHED")
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((section) => ({
      id: section.id,
      type: section.type as PageSectionType,
      sortOrder: section.sortOrder,
      title: locale === "fa" ? section.titleFa : section.titleEn,
      body: locale === "fa" ? section.bodyFa : section.bodyEn,
      ctaLabel: locale === "fa" ? section.ctaLabelFa : section.ctaLabelEn,
      ctaHref: section.ctaHref,
      backgroundUrl: section.backgroundUrl,
      backgroundAlt: locale === "fa" ? section.backgroundAltFa : section.backgroundAltEn,
      settings: parseSettings(section.settings) ?? {},
    }));
}
