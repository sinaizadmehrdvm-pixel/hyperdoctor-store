import type {AppLocale} from "@/lib/calendar";
export type CalendarEvent={date:string;title:string;holiday?:boolean;source?:"official"|"religious"|"editorial"};
// Holiday/event data is separate from conversion because official/religious dates can change by jurisdiction and year.
export const STATIC_CALENDAR_EVENTS:Partial<Record<AppLocale,CalendarEvent[]>>={};
export function eventsForDate(locale:AppLocale,isoDate:string,extra:CalendarEvent[]=[]){return[...(STATIC_CALENDAR_EVENTS[locale]??[]),...extra].filter(event=>event.date===isoDate);}
