export type BuilderLocale = "fa" | "tr" | "en" | "ar";
export type BuilderViewport = "desktop" | "tablet" | "mobile";
export type BuilderSectionType = "hero" | "richText" | "imageText" | "cards" | "cta" | "spacer";

export type LocalizedText = Partial<Record<BuilderLocale, string>>;

export type BuilderSection = {
  id: string;
  type: BuilderSectionType;
  visible?: boolean;
  content: {
    eyebrow?: LocalizedText;
    title?: LocalizedText;
    body?: LocalizedText;
    text?: LocalizedText;
    buttonLabel?: LocalizedText;
    buttonHref?: string;
    imageUrl?: string;
    imageAlt?: LocalizedText;
    cards?: Array<{
      id: string;
      title: LocalizedText;
      body: LocalizedText;
      imageUrl?: string;
      href?: string;
    }>;
    [key: string]: unknown;
  };
  settings?: {
    background?: string;
    foreground?: string;
    maxWidth?: string;
    paddingY?: string;
    minHeight?: string;
    radius?: string;
    align?: "start" | "center" | "end";
    imagePosition?: "start" | "end";
    columns?: 2 | 3 | 4;
    hiddenOn?: BuilderViewport[];
    [key: string]: unknown;
  };
};

export type BuilderDocument = {
  version: 1;
  sections: BuilderSection[];
};

export type BuilderRevision = { revision: number; createdAt?: string };

export type BuilderBundle = {
  page: {
    id: string;
    slug: string;
    titleFa: string;
    titleTr: string;
    titleEn: string;
    titleAr: string;
    template: string;
    isPublished?: boolean;
  };
  draft: BuilderDocument;
  published: BuilderDocument | null;
  draftUpdatedAt?: string;
  publishedAt?: string;
  publishedRevision: number;
  revisions: BuilderRevision[];
};

export function localize(value: LocalizedText | undefined, locale: string) {
  if (!value) return "";
  const preferred = value[locale as BuilderLocale];
  if (typeof preferred === "string" && preferred.trim()) return preferred;
  return value.en || value.fa || value.tr || value.ar || "";
}

export function createSection(type: BuilderSectionType): BuilderSection {
  const id = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const base = { id, type, visible: true, content: {}, settings: { background: "#ffffff", foreground: "#001736", maxWidth: "1180", paddingY: "64", align: "start" as const } };
  if (type === "hero") return { ...base, content: { eyebrow: { fa: "بخش ویژه", en: "Featured" }, title: { fa: "عنوان اصلی را ویرایش کنید", en: "Edit your main headline" }, body: { fa: "متن توضیحی این بخش", en: "Section supporting copy" }, buttonLabel: { fa: "بیشتر بدانید", en: "Learn more" }, buttonHref: "/" }, settings: { ...base.settings, minHeight: "520", align: "center" } };
  if (type === "richText") return { ...base, content: { text: { fa: "متن این بخش را مستقیم ویرایش کنید.", en: "Edit this section directly." } } };
  if (type === "imageText") return { ...base, content: { title: { fa: "عنوان تصویر و متن", en: "Image and text" }, body: { fa: "توضیحات این بخش", en: "Section description" }, imageUrl: "" }, settings: { ...base.settings, imagePosition: "end" } };
  if (type === "cards") return { ...base, content: { title: { fa: "کارت‌ها", en: "Cards" }, cards: [1,2,3].map((n) => ({ id: `${id}-card-${n}`, title: { fa: `کارت ${n}`, en: `Card ${n}` }, body: { fa: "توضیح کوتاه", en: "Short description" } })) }, settings: { ...base.settings, columns: 3 } };
  if (type === "cta") return { ...base, content: { title: { fa: "آماده شروع هستید؟", en: "Ready to get started?" }, body: { fa: "متن فراخوان", en: "Call to action copy" }, buttonLabel: { fa: "شروع", en: "Get started" }, buttonHref: "/" }, settings: { ...base.settings, align: "center" } };
  return { ...base, content: {}, settings: { ...base.settings, paddingY: "32" } };
}

export function normalizeDocument(value: unknown): BuilderDocument {
  if (!value || typeof value !== "object") return { version: 1, sections: [] };
  const candidate = value as { sections?: unknown };
  return { version: 1, sections: Array.isArray(candidate.sections) ? candidate.sections.slice(0, 100) as BuilderSection[] : [] };
}
