export type AppLocale = "fa" | "tr" | "en" | "ar";
export type HolidayRegion = "IR" | "TR" | null;
export type WeekRegion = "IR" | "TR" | null;
export type CalendarSystem = "persian" | "islamic-umalqura" | "gregory";

type WeekRules = {
  firstDay: 0 | 1 | 6;
  weekendDays: number[];
};

export type CalendarConfig = {
  locale: string;
  calendar: CalendarSystem;
  direction: "rtl" | "ltr";
  weekRegion: WeekRegion;
  holidayRegion: HolidayRegion;
};

// Territory week rules are independent from language and calendar system.
// The null fallback follows CLDR world/001: Monday first day, Saturday/Sunday weekend.
export const WEEK_RULES: Record<Exclude<WeekRegion, null> | "001", WeekRules> = {
  "001": { firstDay: 1, weekendDays: [0, 6] },
  IR: { firstDay: 6, weekendDays: [5] },
  TR: { firstDay: 1, weekendDays: [0, 6] },
};

export const CALENDAR_CONFIG: Record<AppLocale, CalendarConfig> = {
  fa: {
    locale: "fa-IR-u-ca-persian-nu-arabext",
    calendar: "persian",
    direction: "rtl",
    weekRegion: "IR",
    holidayRegion: "IR",
  },
  ar: {
    locale: "ar-u-ca-islamic-umalqura-nu-arab",
    calendar: "islamic-umalqura",
    direction: "rtl",
    weekRegion: null,
    holidayRegion: null,
  },
  tr: {
    locale: "tr-TR-u-ca-gregory",
    calendar: "gregory",
    direction: "ltr",
    weekRegion: "TR",
    holidayRegion: "TR",
  },
  en: {
    locale: "en-u-ca-gregory",
    calendar: "gregory",
    direction: "ltr",
    weekRegion: null,
    holidayRegion: null,
  },
};

const ISO_DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;
const LOCAL_DATE_TIME = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,3})?)?$/;

export function appLocale(locale: string): AppLocale {
  return locale === "fa" || locale === "tr" || locale === "ar" ? locale : "en";
}

export function calendarConfig(locale: string): CalendarConfig {
  return CALENDAR_CONFIG[appLocale(locale)];
}

export function calendarWeekRules(locale: string): WeekRules {
  const region = calendarConfig(locale).weekRegion;
  return WEEK_RULES[region ?? "001"];
}

export function parseISODateOnly(value: string): Date | null {
  const match = ISO_DATE_ONLY.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day, 12, 0, 0, 0);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) return null;
  return date;
}

export function calendarDate(value: Date | string | number): Date | null {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === "string" && ISO_DATE_ONLY.test(value)) return parseISODateOnly(value);
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatLocalizedDate(
  value: Date | string | number,
  locale: string,
  options: Intl.DateTimeFormatOptions = {},
) {
  const date = calendarDate(value);
  if (!date) return "—";
  return new Intl.DateTimeFormat(calendarConfig(locale).locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
    ...options,
  }).format(date);
}

export function formatLocalizedDateTime(value: Date | string | number, locale: string) {
  return formatLocalizedDate(value, locale, { hour: "2-digit", minute: "2-digit" });
}

export function localISODate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function localDateTimeInputValue(value: Date | string | number) {
  const date = calendarDate(value);
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hour}:${minute}`;
}

export function localDateTimeToISO(value: string) {
  if (!value) return "";
  const match = LOCAL_DATE_TIME.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6] ?? 0);
  const date = new Date(year, month - 1, day, hour, minute, second, 0);
  if (
    date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day ||
    date.getHours() !== hour || date.getMinutes() !== minute || date.getSeconds() !== second
  ) return null;
  return date.toISOString();
}

export function calendarParts(value: Date | string | number, locale: string) {
  const date = calendarDate(value);
  if (!date) return null;
  const parts = new Intl.DateTimeFormat(calendarConfig(locale).locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find(part => part.type === type)?.value ?? "";
  return { year: get("year"), month: get("month"), day: get("day"), weekday: get("weekday") };
}

export function calendarNumericParts(value: Date | string | number, locale: string) {
  const date = calendarDate(value);
  if (!date) return null;
  const config = calendarConfig(locale);
  const formatterLocale = `en-u-ca-${config.calendar}-nu-latn`;
  const parts = new Intl.DateTimeFormat(formatterLocale, {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(date);
  const get = (type: "year" | "month" | "day") => Number(parts.find(part => part.type === type)?.value ?? NaN);
  const year = get("year");
  const month = get("month");
  const day = get("day");
  return Number.isFinite(year) && Number.isFinite(month) && Number.isFinite(day) ? { year, month, day } : null;
}
