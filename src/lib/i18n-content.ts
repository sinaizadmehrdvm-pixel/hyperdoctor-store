export type AppLocale = "fa" | "tr" | "en" | "ar";

export function normalizeLocale(locale: string): AppLocale {
  return locale === "tr" || locale === "en" || locale === "ar" ? locale : "fa";
}

export function isRtlLocale(locale: string) {
  return locale === "fa" || locale === "ar";
}

export function pickLocalized(
  locale: string,
  values: {
    fa?: string | null;
    tr?: string | null;
    en?: string | null;
    ar?: string | null;
  },
): string {
  const normalized = normalizeLocale(locale);
  const preferred = values[normalized]?.trim();
  if (preferred) return preferred;

  const fallbackOrder: AppLocale[] = normalized === "ar"
    ? ["fa", "en", "tr"]
    : normalized === "tr"
      ? ["en", "fa", "ar"]
      : normalized === "en"
        ? ["fa", "tr", "ar"]
        : ["en", "tr", "ar"];

  for (const key of fallbackOrder) {
    const value = values[key]?.trim();
    if (value) return value;
  }
  return "";
}

export function localizedName(
  locale: string,
  entity: {
    nameFa?: string | null;
    nameTr?: string | null;
    nameEn?: string | null;
    nameAr?: string | null;
  },
) {
  return pickLocalized(locale, {
    fa: entity.nameFa,
    tr: entity.nameTr,
    en: entity.nameEn,
    ar: entity.nameAr,
  });
}

export function localizedDescription(
  locale: string,
  entity: {
    descriptionFa?: string | null;
    descriptionTr?: string | null;
    descriptionEn?: string | null;
    descriptionAr?: string | null;
  },
) {
  return pickLocalized(locale, {
    fa: entity.descriptionFa,
    tr: entity.descriptionTr,
    en: entity.descriptionEn,
    ar: entity.descriptionAr,
  });
}

export function localizedTitle(
  locale: string,
  entity: {
    titleFa?: string | null;
    titleTr?: string | null;
    titleEn?: string | null;
    titleAr?: string | null;
  },
) {
  return pickLocalized(locale, {
    fa: entity.titleFa,
    tr: entity.titleTr,
    en: entity.titleEn,
    ar: entity.titleAr,
  });
}

export function localizedAlt(
  locale: string,
  media: {
    altFa?: string | null;
    altTr?: string | null;
    altEn?: string | null;
    altAr?: string | null;
  },
  fallback = "",
) {
  return pickLocalized(locale, {
    fa: media.altFa,
    tr: media.altTr,
    en: media.altEn,
    ar: media.altAr,
  }) || fallback;
}
