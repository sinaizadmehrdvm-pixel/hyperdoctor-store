export type AppLocale = "fa" | "tr" | "en" | "ar";

export const CALENDAR_CONFIG: Record<AppLocale, { locale: string; calendar: string; direction: "rtl" | "ltr"; region: string }> = {
  fa: { locale: "fa-IR-u-ca-persian-nu-arabext", calendar: "persian", direction: "rtl", region: "IR" },
  ar: { locale: "ar-SA-u-ca-islamic-umalqura-nu-arab", calendar: "islamic-umalqura", direction: "rtl", region: "SA" },
  tr: { locale: "tr-TR-u-ca-gregory", calendar: "gregory", direction: "ltr", region: "TR" },
  en: { locale: "en-US-u-ca-gregory", calendar: "gregory", direction: "ltr", region: "US" },
};
export function appLocale(locale:string):AppLocale{return locale==="fa"||locale==="tr"||locale==="ar"?locale:"en";}
export function calendarConfig(locale:string){return CALENDAR_CONFIG[appLocale(locale)];}
export function formatLocalizedDate(value:Date|string|number,locale:string,options:Intl.DateTimeFormatOptions={}){const date=value instanceof Date?value:new Date(value);if(Number.isNaN(date.getTime()))return "—";return new Intl.DateTimeFormat(calendarConfig(locale).locale,{year:"numeric",month:"long",day:"numeric",...options}).format(date);}
export function formatLocalizedDateTime(value:Date|string|number,locale:string){return formatLocalizedDate(value,locale,{hour:"2-digit",minute:"2-digit"});}
export function localISODate(date=new Date()){const y=date.getFullYear(),m=String(date.getMonth()+1).padStart(2,"0"),d=String(date.getDate()).padStart(2,"0");return `${y}-${m}-${d}`;}
export function calendarParts(value:Date|string|number,locale:string){const date=value instanceof Date?value:new Date(value);if(Number.isNaN(date.getTime()))return null;const parts=new Intl.DateTimeFormat(calendarConfig(locale).locale,{year:"numeric",month:"long",day:"numeric",weekday:"long"}).formatToParts(date);const get=(type:Intl.DateTimeFormatPartTypes)=>parts.find(p=>p.type===type)?.value??"";return{year:get("year"),month:get("month"),day:get("day"),weekday:get("weekday")};}
export function calendarNumericParts(value:Date|string|number,locale:string){const date=value instanceof Date?value:new Date(value);if(Number.isNaN(date.getTime()))return null;const config=calendarConfig(locale);const formatterLocale=`en-US-u-ca-${config.calendar}-nu-latn`;const parts=new Intl.DateTimeFormat(formatterLocale,{year:"numeric",month:"numeric",day:"numeric"}).formatToParts(date);const get=(type:"year"|"month"|"day")=>Number(parts.find(part=>part.type===type)?.value??NaN);const year=get("year"),month=get("month"),day=get("day");return Number.isFinite(year)&&Number.isFinite(month)&&Number.isFinite(day)?{year,month,day}:null;}
