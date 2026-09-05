export type BuilderLocale = "fa" | "tr" | "en" | "ar";
export type BuilderViewport = "desktop" | "tablet" | "mobile";
export type BuilderSectionType = "hero" | "richText" | "imageText" | "cards" | "cta" | "spacer";
export type BuilderTemplate = "blank" | "landing" | "service" | "about" | "campaign";

export type LocalizedText = Partial<Record<BuilderLocale, string>>;

export type BuilderTheme = {
  pageBackground?: string;
  surface?: string;
  foreground?: string;
  accent?: string;
  muted?: string;
  radius?: string;
  sectionGap?: string;
  fontScale?: "sm" | "md" | "lg";
};

export type BuilderCard = {
  id: string;
  title: LocalizedText;
  body: LocalizedText;
  imageUrl?: string;
  href?: string;
};

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
    cards?: BuilderCard[];
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
  theme?: BuilderTheme;
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

export const defaultBuilderTheme: BuilderTheme = {
  pageBackground: "#f4f7fb",
  surface: "#ffffff",
  foreground: "#001736",
  accent: "#e80346",
  muted: "#667085",
  radius: "24",
  sectionGap: "0",
  fontScale: "md",
};

export function localize(value: LocalizedText | undefined, locale: string) {
  if (!value) return "";
  const preferred = value[locale as BuilderLocale];
  if (typeof preferred === "string" && preferred.trim()) return preferred;
  return value.en || value.fa || value.tr || value.ar || "";
}

function uid(prefix: string) {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createSection(type: BuilderSectionType): BuilderSection {
  const id = uid(type);
  const base = { id, type, visible: true, content: {}, settings: { background: "#ffffff", foreground: "#001736", maxWidth: "1180", paddingY: "64", align: "start" as const, radius: "0", hiddenOn: [] as BuilderViewport[] } };
  if (type === "hero") return { ...base, content: { eyebrow: { fa: "بخش ویژه", tr: "Öne çıkan", en: "Featured", ar: "مميز" }, title: { fa: "عنوان اصلی را ویرایش کنید", tr: "Ana başlığınızı düzenleyin", en: "Edit your main headline", ar: "حرر العنوان الرئيسي" }, body: { fa: "متن توضیحی این بخش", tr: "Bu bölümün açıklama metni", en: "Section supporting copy", ar: "النص التوضيحي لهذا القسم" }, buttonLabel: { fa: "بیشتر بدانید", tr: "Daha fazla", en: "Learn more", ar: "اعرف المزيد" }, buttonHref: "/" }, settings: { ...base.settings, minHeight: "520", align: "center" } };
  if (type === "richText") return { ...base, content: { text: { fa: "متن این بخش را مستقیم روی صفحه ویرایش کنید.", tr: "Bu metni doğrudan sayfada düzenleyin.", en: "Edit this text directly on the canvas.", ar: "حرر هذا النص مباشرة على الصفحة." } } };
  if (type === "imageText") return { ...base, content: { title: { fa: "عنوان تصویر و متن", tr: "Görsel ve metin", en: "Image and text", ar: "صورة ونص" }, body: { fa: "توضیحات این بخش", tr: "Bölüm açıklaması", en: "Section description", ar: "وصف القسم" }, imageUrl: "" }, settings: { ...base.settings, imagePosition: "end" } };
  if (type === "cards") return { ...base, content: { title: { fa: "کارت‌ها", tr: "Kartlar", en: "Cards", ar: "البطاقات" }, cards: [1,2,3].map((n) => ({ id: `${id}-card-${n}`, title: { fa: `کارت ${n}`, tr: `Kart ${n}`, en: `Card ${n}`, ar: `بطاقة ${n}` }, body: { fa: "توضیح کوتاه", tr: "Kısa açıklama", en: "Short description", ar: "وصف قصير" } })) }, settings: { ...base.settings, columns: 3 } };
  if (type === "cta") return { ...base, content: { title: { fa: "آماده شروع هستید؟", tr: "Başlamaya hazır mısınız?", en: "Ready to get started?", ar: "هل أنت مستعد للبدء؟" }, body: { fa: "متن فراخوان", tr: "Harekete geçirici mesaj", en: "Call to action copy", ar: "نص الدعوة إلى الإجراء" }, buttonLabel: { fa: "شروع", tr: "Başla", en: "Get started", ar: "ابدأ" }, buttonHref: "/" }, settings: { ...base.settings, align: "center" } };
  return { ...base, content: {}, settings: { ...base.settings, paddingY: "32" } };
}

function withCopy(section: BuilderSection, patch: Partial<BuilderSection["content"]>, settings?: Partial<NonNullable<BuilderSection["settings"]>>) {
  return { ...section, content: { ...section.content, ...patch }, settings: { ...section.settings, ...settings } };
}

export function createBuilderTemplate(template: BuilderTemplate): BuilderDocument {
  if (template === "blank") return { version: 1, sections: [], theme: { ...defaultBuilderTheme } };
  if (template === "landing") {
    return {
      version: 1,
      theme: { ...defaultBuilderTheme },
      sections: [
        withCopy(createSection("hero"), { eyebrow: { fa: "Hyper Doctor", tr: "Hyper Doctor", en: "Hyper Doctor", ar: "Hyper Doctor" }, title: { fa: "راهکارهای حرفه‌ای سلامت و تجهیزات پزشکی", tr: "Profesyonel sağlık ve medikal ekipman çözümleri", en: "Professional health and medical equipment solutions", ar: "حلول احترافية للصحة والمعدات الطبية" } }, { background: "#001736", foreground: "#ffffff", minHeight: "600" }),
        withCopy(createSection("cards"), { title: { fa: "خدمات و محصولات منتخب", tr: "Öne çıkan hizmet ve ürünler", en: "Featured services and products", ar: "الخدمات والمنتجات المميزة" } }),
        createSection("imageText"),
        withCopy(createSection("cta"), { title: { fa: "برای انتخاب بهتر کنار شما هستیم", tr: "Doğru seçim için yanınızdayız", en: "We help you choose with confidence", ar: "نساعدك على الاختيار بثقة" } }, { background: "#eef6ff" }),
      ],
    };
  }
  if (template === "service") {
    return {
      version: 1,
      theme: { ...defaultBuilderTheme },
      sections: [
        withCopy(createSection("hero"), { eyebrow: { fa: "خدمات تخصصی", tr: "Uzman hizmet", en: "Specialist service", ar: "خدمة متخصصة" } }, { minHeight: "460", background: "#f1f6fb" }),
        createSection("imageText"),
        withCopy(createSection("richText"), { text: { fa: "مراحل، شرایط و جزئیات خدمت را اینجا توضیح دهید.", tr: "Hizmet sürecini ve ayrıntıları burada açıklayın.", en: "Explain the service process and details here.", ar: "اشرح مراحل الخدمة وتفاصيلها هنا." } }),
        createSection("cta"),
      ],
    };
  }
  if (template === "about") {
    return {
      version: 1,
      theme: { ...defaultBuilderTheme, pageBackground: "#ffffff" },
      sections: [
        withCopy(createSection("hero"), { title: { fa: "درباره Hyper Doctor", tr: "Hyper Doctor hakkında", en: "About Hyper Doctor", ar: "حول Hyper Doctor" } }, { minHeight: "420", background: "#ffffff" }),
        createSection("imageText"),
        withCopy(createSection("cards"), { title: { fa: "ارزش‌های ما", tr: "Değerlerimiz", en: "Our values", ar: "قيمنا" } }),
      ],
    };
  }
  return {
    version: 1,
    theme: { ...defaultBuilderTheme, pageBackground: "#001736", foreground: "#ffffff", accent: "#ff315f" },
    sections: [
      withCopy(createSection("hero"), { eyebrow: { fa: "کمپین ویژه", tr: "Özel kampanya", en: "Special campaign", ar: "حملة خاصة" } }, { background: "#001736", foreground: "#ffffff", minHeight: "640" }),
      withCopy(createSection("cards"), {}, { background: "#f8fafc" }),
      withCopy(createSection("cta"), {}, { background: "#e80346", foreground: "#ffffff" }),
    ],
  };
}

export function normalizeDocument(value: unknown): BuilderDocument {
  if (!value || typeof value !== "object") return { version: 1, sections: [], theme: { ...defaultBuilderTheme } };
  const candidate = value as { sections?: unknown; theme?: BuilderTheme };
  return {
    version: 1,
    sections: Array.isArray(candidate.sections) ? candidate.sections.slice(0, 100) as BuilderSection[] : [],
    theme: { ...defaultBuilderTheme, ...(candidate.theme || {}) },
  };
}
