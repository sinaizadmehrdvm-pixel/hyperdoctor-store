"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import {
  appLocale,
  calendarConfig,
  calendarNumericParts,
  calendarParts,
  formatLocalizedDate,
  localISODate,
  parseISODateOnly,
  type AppLocale,
} from "@/lib/calendar";

type Props = {
  value: string;
  onChange: (value: string) => void;
  locale: string;
  min?: string;
  max?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
};

const COPY: Record<AppLocale, { today: string; previous: string; next: string; choose: string }> = {
  fa: { today: "امروز", previous: "ماه قبل", next: "ماه بعد", choose: "انتخاب تاریخ" },
  tr: { today: "Bugün", previous: "Önceki ay", next: "Sonraki ay", choose: "Tarih seç" },
  en: { today: "Today", previous: "Previous month", next: "Next month", choose: "Choose date" },
  ar: { today: "اليوم", previous: "الشهر السابق", next: "الشهر التالي", choose: "اختر التاريخ" },
};

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  next.setHours(12, 0, 0, 0);
  return next;
}

function calendarMonthStart(date: Date, locale: AppLocale) {
  const parts = calendarNumericParts(date, locale);
  return parts ? addDays(date, 1 - parts.day) : new Date(date.getFullYear(), date.getMonth(), 1, 12);
}

function moveCalendarMonth(date: Date, locale: AppLocale, delta: number) {
  let cursor = calendarMonthStart(date, locale);
  if (delta > 0) {
    const current = calendarNumericParts(cursor, locale);
    for (let i = 1; i <= 35; i += 1) {
      const candidate = addDays(cursor, i);
      const parts = calendarNumericParts(candidate, locale);
      if (parts && current && (parts.month !== current.month || parts.year !== current.year)) return candidate;
    }
  } else {
    cursor = addDays(cursor, -1);
    return calendarMonthStart(cursor, locale);
  }
  return cursor;
}

function monthGrid(anchor: Date, locale: AppLocale) {
  const first = calendarMonthStart(anchor, locale);
  const firstDay = calendarConfig(locale).firstDay;
  const offset = (first.getDay() - firstDay + 7) % 7;
  const start = addDays(first, -offset);
  return Array.from({ length: 42 }, (_, index) => addDays(start, index));
}

function monthTitle(date: Date, locale: AppLocale) {
  return new Intl.DateTimeFormat(calendarConfig(locale).locale, { month: "long", year: "numeric" }).format(calendarMonthStart(date, locale));
}

function weekdays(locale: AppLocale) {
  const config = calendarConfig(locale);
  const sunday = new Date(2024, 0, 7, 12);
  return Array.from({ length: 7 }, (_, index) => {
    const date = addDays(sunday, (config.firstDay + index) % 7);
    return new Intl.DateTimeFormat(config.locale, { weekday: "short" }).format(date);
  });
}

export function LocalizedDatePicker({ value, onChange, locale: rawLocale, min, max, disabled, id, className = "" }: Props) {
  const locale = appLocale(rawLocale);
  const config = calendarConfig(locale);
  const copy = COPY[locale];
  const selected = parseISODateOnly(value);
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const minDate = min ? parseISODateOnly(min) : null;
  const maxDate = max ? parseISODateOnly(max) : null;
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState(() => selected ?? minDate ?? today);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selected) setAnchor(selected);
  }, [value]);

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      if (root.current && !root.current.contains(event.target as Node)) setOpen(false);
    };
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", key);
    };
  }, [open]);

  const days = useMemo(() => monthGrid(anchor, locale), [anchor, locale]);
  const names = useMemo(() => weekdays(locale), [locale]);
  const anchorParts = calendarNumericParts(anchor, locale);
  const blocked = (date: Date) => Boolean((minDate && date < minDate) || (maxDate && date > maxDate));
  const choose = (date: Date) => {
    if (blocked(date)) return;
    onChange(localISODate(date));
    setAnchor(date);
    setOpen(false);
  };
  const display = selected
    ? formatLocalizedDate(selected, locale, { weekday: "long", year: "numeric", month: "long", day: "numeric" })
    : copy.choose;

  return (
    <div ref={root} className={`relative ${className}`} dir={config.direction}>
      <button id={id} type="button" disabled={disabled} aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(current => !current)} className="flex h-12 w-full items-center gap-2 rounded-xl border border-[#c4c6d0] bg-[#f7fafd] px-3 text-start text-sm font-bold text-[#001736] outline-none transition hover:border-[#009dd8] focus-visible:border-[#009dd8] focus-visible:ring-2 focus-visible:ring-[#009dd8]/20 disabled:cursor-not-allowed disabled:opacity-60">
        <CalendarDays className="h-4 w-4 shrink-0 text-[#009dd8]" aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate">{display}</span>
      </button>
      {open ? (
        <div role="dialog" aria-modal="false" aria-label={copy.choose} className="absolute z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-[#dfe4ea] bg-white p-4 shadow-[0_24px_60px_rgba(0,23,54,.18)]">
          <div className="flex items-center justify-between gap-2">
            <button type="button" aria-label={copy.previous} onClick={() => setAnchor(current => moveCalendarMonth(current, locale, -1))} className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#dfe4ea] text-[#002b5b] hover:border-[#009dd8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#009dd8]/25">
              {config.direction === "rtl" ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
            <strong className="text-sm font-black text-[#001736]">{monthTitle(anchor, locale)}</strong>
            <button type="button" aria-label={copy.next} onClick={() => setAnchor(current => moveCalendarMonth(current, locale, 1))} className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#dfe4ea] text-[#002b5b] hover:border-[#009dd8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#009dd8]/25">
              {config.direction === "rtl" ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          </div>
          <div className="mt-3 grid grid-cols-7 gap-1">
            {names.map((name, index) => <span key={`${name}-${index}`} className="py-1 text-center text-[11px] font-bold text-[#747780]">{name}</span>)}
            {days.map(date => {
              const key = localISODate(date);
              const parts = calendarParts(date, locale);
              const numeric = calendarNumericParts(date, locale);
              const outside = Boolean(numeric && anchorParts && (numeric.month !== anchorParts.month || numeric.year !== anchorParts.year));
              const isSelected = Boolean(selected && sameDay(date, selected));
              const isToday = sameDay(date, today);
              const isBlocked = blocked(date);
              const isWeekend = config.weekendDays.includes(date.getDay());
              return (
                <button key={key} type="button" disabled={isBlocked} aria-label={formatLocalizedDate(date, locale, { year: "numeric", month: "long", day: "numeric" })} aria-current={isToday ? "date" : undefined} aria-pressed={isSelected} onClick={() => choose(date)} className={`aspect-square rounded-xl text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#009dd8]/30 ${isSelected ? "bg-[#002b5b] text-white shadow-sm" : isToday ? "border border-[#009dd8] bg-[#d6e3ff]/30 text-[#002b5b]" : outside ? "text-[#a9adb5] hover:bg-[#f3f7fb]" : isWeekend ? "bg-[#fff8f8] text-[#8b3441] hover:bg-[#fff0f1]" : "text-[#30343b] hover:bg-[#edf4fb]"} disabled:cursor-not-allowed disabled:opacity-25`}>
                  {parts?.day ?? date.getDate()}
                </button>
              );
            })}
          </div>
          <div className="mt-3 border-t border-[#edf0f3] pt-3">
            <button type="button" disabled={blocked(today)} onClick={() => choose(today)} className="min-h-10 w-full rounded-xl bg-[#edf4fb] px-3 text-xs font-black text-[#002b5b] hover:bg-[#d6e3ff] disabled:opacity-40">{copy.today}</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
