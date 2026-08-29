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

const DIYANET_TR_2026: CalendarEventSource = {
  authority: "T.C. Diyanet İşleri Başkanlığı",
  url: "https://vakithesaplama.diyanet.gov.tr/icerik.php?icerik=158",
  accessedAt: "2026-08-29",
};

function trHoliday(date: string, tr: string, en: string, halfDay = false): CalendarEvent {
  return {
    date,
    titles: { tr, en },
    kind: "official-holiday",
    jurisdiction: "TR",
    halfDay,
    verifiedYear: 2026,
    source: DIYANET_TR_2026,
  };
}

// Year-specific official Türkiye holidays, verified against Diyanet's 2026 list
// prepared under Law No. 2429. Do not extrapolate moving religious dates to other years.
export const STATIC_CALENDAR_EVENTS: CalendarEvent[] = [
  trHoliday("2026-01-01", "Yılbaşı", "New Year's Day"),
  trHoliday("2026-03-19", "Ramazan Bayramı Arefesi", "Ramadan Feast Eve", true),
  trHoliday("2026-03-20", "Ramazan Bayramı (1. Gün)", "Ramadan Feast — Day 1"),
  trHoliday("2026-03-21", "Ramazan Bayramı (2. Gün)", "Ramadan Feast — Day 2"),
  trHoliday("2026-03-22", "Ramazan Bayramı (3. Gün)", "Ramadan Feast — Day 3"),
  trHoliday("2026-04-23", "Ulusal Egemenlik ve Çocuk Bayramı", "National Sovereignty and Children's Day"),
  trHoliday("2026-05-01", "Emek ve Dayanışma Günü", "Labour and Solidarity Day"),
  trHoliday("2026-05-19", "Atatürk'ü Anma, Gençlik ve Spor Bayramı", "Commemoration of Atatürk, Youth and Sports Day"),
  trHoliday("2026-05-26", "Kurban Bayramı Arefesi", "Sacrifice Feast Eve", true),
  trHoliday("2026-05-27", "Kurban Bayramı (1. Gün)", "Sacrifice Feast — Day 1"),
  trHoliday("2026-05-28", "Kurban Bayramı (2. Gün)", "Sacrifice Feast — Day 2"),
  trHoliday("2026-05-29", "Kurban Bayramı (3. Gün)", "Sacrifice Feast — Day 3"),
  trHoliday("2026-05-30", "Kurban Bayramı (4. Gün)", "Sacrifice Feast — Day 4"),
  trHoliday("2026-07-15", "Demokrasi ve Millî Birlik Günü", "Democracy and National Unity Day"),
  trHoliday("2026-08-30", "Zafer Bayramı", "Victory Day"),
  trHoliday("2026-10-28", "Cumhuriyet Bayramı Arifesi", "Republic Day Eve", true),
  trHoliday("2026-10-29", "Cumhuriyet Bayramı", "Republic Day"),
];

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
