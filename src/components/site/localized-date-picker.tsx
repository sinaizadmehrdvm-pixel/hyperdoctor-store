"use client";

import {useEffect,useMemo,useRef,useState} from "react";
import {CalendarDays,ChevronLeft,ChevronRight} from "lucide-react";
import {appLocale,calendarConfig,calendarParts,formatLocalizedDate,localISODate,type AppLocale} from "@/lib/calendar";

type Props={value:string;onChange:(value:string)=>void;locale:string;min?:string;max?:string;disabled?:boolean;id?:string;className?:string};
const COPY:Record<AppLocale,{today:string;previous:string;next:string;choose:string}>={
 fa:{today:"امروز",previous:"ماه قبل",next:"ماه بعد",choose:"انتخاب تاریخ"},
 tr:{today:"Bugün",previous:"Önceki ay",next:"Sonraki ay",choose:"Tarih seç"},
 en:{today:"Today",previous:"Previous month",next:"Next month",choose:"Choose date"},
 ar:{today:"اليوم",previous:"الشهر السابق",next:"الشهر التالي",choose:"اختر التاريخ"},
};
function parseISO(value?:string){if(!value)return null;const [y,m,d]=value.split("-").map(Number);if(!y||!m||!d)return null;const date=new Date(y,m-1,d,12);return Number.isNaN(date.getTime())?null:date;}
function iso(date:Date){return localISODate(date)}
function sameDay(a:Date,b:Date){return a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate()}
function weekStart(locale:AppLocale){return locale==="fa"?6:locale==="ar"?0:1}
function monthGrid(anchor:Date,locale:AppLocale){const first=new Date(anchor.getFullYear(),anchor.getMonth(),1,12);const offset=(first.getDay()-weekStart(locale)+7)%7;const start=new Date(first);start.setDate(first.getDate()-offset);return Array.from({length:42},(_,i)=>{const date=new Date(start);date.setDate(start.getDate()+i);return date})}
function monthTitle(date:Date,locale:AppLocale){return new Intl.DateTimeFormat(calendarConfig(locale).locale,{month:"long",year:"numeric"}).format(date)}
function weekdays(locale:AppLocale){const base=new Date(2024,0,7,12);const start=weekStart(locale);return Array.from({length:7},(_,i)=>{const date=new Date(base);date.setDate(base.getDate()+((start+i)%7));return new Intl.DateTimeFormat(calendarConfig(locale).locale,{weekday:"short"}).format(date)})}

export function LocalizedDatePicker({value,onChange,locale:rawLocale,min,max,disabled,id,className=""}:Props){
 const locale=appLocale(rawLocale),copy=COPY[locale],dir=calendarConfig(locale).direction;const selected=parseISO(value),today=new Date();today.setHours(12,0,0,0);const minDate=parseISO(min),maxDate=parseISO(max);
 const [open,setOpen]=useState(false);const [anchor,setAnchor]=useState(()=>selected??minDate??today);const root=useRef<HTMLDivElement>(null);
 useEffect(()=>{if(selected)setAnchor(selected)},[value]);
 useEffect(()=>{if(!open)return;const close=(event:PointerEvent)=>{if(root.current&&!root.current.contains(event.target as Node))setOpen(false)};document.addEventListener("pointerdown",close);return()=>document.removeEventListener("pointerdown",close)},[open]);
 const days=useMemo(()=>monthGrid(anchor,locale),[anchor,locale]),names=useMemo(()=>weekdays(locale),[locale]);
 const blocked=(date:Date)=>(minDate&&date<minDate)||(maxDate&&date>maxDate);
 const moveMonth=(delta:number)=>setAnchor(current=>new Date(current.getFullYear(),current.getMonth()+delta,1,12));
 const choose=(date:Date)=>{if(blocked(date))return;onChange(iso(date));setAnchor(date);setOpen(false)};
 const display=selected?formatLocalizedDate(selected,locale,{weekday:"long",year:"numeric",month:"long",day:"numeric"}):copy.choose;
 return <div ref={root} className={`relative ${className}`} dir={dir}>
  <button id={id} type="button" disabled={disabled} aria-haspopup="dialog" aria-expanded={open} onClick={()=>setOpen(v=>!v)} className="flex h-12 w-full items-center gap-2 rounded-xl border border-[#c4c6d0] bg-[#f7fafd] px-3 text-start text-sm font-bold text-[#001736] outline-none transition hover:border-[#009dd8] focus-visible:border-[#009dd8] focus-visible:ring-2 focus-visible:ring-[#009dd8]/20 disabled:cursor-not-allowed disabled:opacity-60"><CalendarDays className="h-4 w-4 shrink-0 text-[#009dd8]" aria-hidden="true"/><span className="min-w-0 flex-1 truncate">{display}</span></button>
  {open?<div role="dialog" aria-label={copy.choose} className="absolute z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-[#dfe4ea] bg-white p-4 shadow-[0_24px_60px_rgba(0,23,54,.18)]">
   <div className="flex items-center justify-between gap-2"><button type="button" aria-label={copy.previous} onClick={()=>moveMonth(-1)} className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#dfe4ea] text-[#002b5b] hover:border-[#009dd8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#009dd8]/25">{dir==="rtl"?<ChevronRight className="h-4 w-4"/>:<ChevronLeft className="h-4 w-4"/>}</button><strong className="text-sm font-black text-[#001736]">{monthTitle(anchor,locale)}</strong><button type="button" aria-label={copy.next} onClick={()=>moveMonth(1)} className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#dfe4ea] text-[#002b5b] hover:border-[#009dd8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#009dd8]/25">{dir==="rtl"?<ChevronLeft className="h-4 w-4"/>:<ChevronRight className="h-4 w-4"/>}</button></div>
   <div className="mt-3 grid grid-cols-7 gap-1">{names.map((name,i)=><span key={`${name}-${i}`} className="py-1 text-center text-[11px] font-bold text-[#747780]">{name}</span>)}{days.map(date=>{const key=iso(date),parts=calendarParts(date,locale),outside=date.getMonth()!==anchor.getMonth(),isSelected=selected&&sameDay(date,selected),isToday=sameDay(date,today),isBlocked=!!blocked(date);return <button key={key} type="button" disabled={isBlocked} aria-current={isToday?"date":undefined} aria-pressed={!!isSelected} onClick={()=>choose(date)} className={`aspect-square rounded-xl text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#009dd8]/30 ${isSelected?"bg-[#002b5b] text-white shadow-sm":isToday?"border border-[#009dd8] bg-[#d6e3ff]/30 text-[#002b5b]":outside?"text-[#a9adb5] hover:bg-[#f3f7fb]":"text-[#30343b] hover:bg-[#edf4fb]"} disabled:cursor-not-allowed disabled:opacity-25`}>{parts?.day??date.getDate()}</button>})}</div>
   <div className="mt-3 border-t border-[#edf0f3] pt-3"><button type="button" disabled={!!blocked(today)} onClick={()=>choose(today)} className="min-h-10 w-full rounded-xl bg-[#edf4fb] px-3 text-xs font-black text-[#002b5b] hover:bg-[#d6e3ff] disabled:opacity-40">{copy.today}</button></div>
  </div>:null}
 </div>
}
