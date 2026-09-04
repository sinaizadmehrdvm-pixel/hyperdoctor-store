"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Search, X } from "lucide-react";
import { AdminSidebar } from "@/components/admin/sidebar";
import { HyperDoctorLogo } from "@/components/site/logo";
import type { AdminRole } from "@/lib/admin-permissions";
import type { AdminLocale } from "@/components/admin/locale-switcher";

const copy={fa:{menu:"منوی مدیریت",search:"جستجوی مدیریت",site:"مشاهده سایت"},ar:{menu:"قائمة الإدارة",search:"بحث الإدارة",site:"عرض الموقع"},en:{menu:"Admin menu",search:"Admin search",site:"View site"},tr:{menu:"Yönetim menüsü",search:"Yönetim araması",site:"Siteyi görüntüle"}} as const;

export function AdminMobileNav({locale,role}:{locale:AdminLocale;role:AdminRole}){
  const [open,setOpen]=useState(false);
  const pathname=usePathname();
  const t=copy[locale];
  useEffect(()=>setOpen(false),[pathname]);
  useEffect(()=>{if(!open)return;const previous=document.body.style.overflow;document.body.style.overflow="hidden";const onKey=(event:KeyboardEvent)=>{if(event.key==="Escape")setOpen(false)};window.addEventListener("keydown",onKey);return()=>{document.body.style.overflow=previous;window.removeEventListener("keydown",onKey)}},[open]);
  return <>
    <button type="button" onClick={()=>setOpen(true)} aria-label={t.menu} aria-expanded={open} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#e0e3e6] bg-white text-[#5f6570] transition hover:border-[#009dd8]/40 hover:text-[#002b5b] lg:hidden"><Menu className="h-5 w-5"/></button>
    {open?<div className="fixed inset-0 z-[80] lg:hidden" role="dialog" aria-modal="true" aria-label={t.menu}>
      <button type="button" aria-label={locale==="fa"?"بستن":locale==="ar"?"إغلاق":locale==="tr"?"Kapat":"Close"} onClick={()=>setOpen(false)} className="absolute inset-0 bg-[#001736]/35 backdrop-blur-[2px]"/>
      <aside className={`absolute inset-y-0 flex w-[min(88vw,320px)] flex-col bg-white shadow-2xl ${locale==="fa"||locale==="ar"?"right-0":"left-0"}`}>
        <div className="flex h-[74px] items-center gap-3 border-b border-[#edf0f2] px-4"><div className="min-w-0 flex-1"><HyperDoctorLogo/></div><button type="button" onClick={()=>setOpen(false)} className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#e0e3e6] text-[#5f6570]" aria-label={locale==="fa"?"بستن":locale==="ar"?"إغلاق":locale==="tr"?"Kapat":"Close"}><X className="h-5 w-5"/></button></div>
        <div className="border-b border-[#edf0f2] p-3"><Link href="/admin/search" className="flex min-h-11 items-center gap-2 rounded-xl bg-[#f7fafd] px-3 text-xs font-black text-[#5f6570]"><Search className="h-4 w-4"/>{t.search}</Link></div>
        <div className="flex-1 overflow-y-auto overscroll-contain py-1"><AdminSidebar locale={locale} role={role}/></div>
        <div className="border-t border-[#edf0f2] p-4"><Link href={`/${locale}`} className="flex min-h-11 items-center justify-center rounded-xl bg-[#f1f4f7] px-3 text-xs font-black text-[#5f6570]">{t.site}</Link></div>
      </aside>
    </div>:null}
  </>;
}
