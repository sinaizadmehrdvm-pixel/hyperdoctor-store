import { appLocale, calendarConfig, type AppLocale, type HolidayRegion } from "@/lib/calendar";

export type CalendarEventKind = "official-holiday" | "religious" | "occasion" | "editorial";
export type CalendarEventSource = {
  authority: string;
  url?: string;
  accessedAt?: string;
};

export type CalendarEvent = {
  date: string;
  titles: Partial<Record<AppLocale, string>> & { en: string };
  kind: CalendarEventKind;
  jurisdiction: HolidayRegion;
  halfDay?: boolean;
  verifiedYear?: number;
  source?: CalendarEventSource;
};

// Calendar conversion and holiday jurisdiction are deliberately separate.
// Keep this empty until year-specific dates are verified against an authoritative source.
export const STATIC_CALENDAR_EVENTS: CalendarEvent[] = [];

export function calendarEventTitle(event: CalendarEvent, locale: string) {
  const resolved = appLocale(locale);
  return event.titles[resolved] ?? event.titles.en;
}

export function eventsForDate(locale: string, isoDate: string, extra: CalendarEvent[] = []) {
  const resolved = appLocale(locale);
  const jurisdiction = calendarConfig(resolved).holidayRegion;
  return [...STATIC_CALENDAR_EVENTS, ...extra].filter(event => {
    if (event.date !== isoDate) return false;
    if (event.kind === "official-holiday") return Boolean(jurisdiction && event.jurisdiction === jurisdiction);
    return event.jurisdiction === null || event.jurisdiction === jurisdiction;
  });
}
