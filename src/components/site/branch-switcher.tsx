"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { MapPin } from "lucide-react";

type Branch={id:string;code:string;nameFa:string;nameTr:string;nameEn:string;nameAr:string;countryCode:string;currency:string;isDefault:boolean;warehouseCount:number;sellableUnits:number};
function name(b:Branch,locale:string){return(locale==="fa"?b.nameFa:locale==="tr"?b.nameTr:locale==="ar"?b.nameAr:b.nameEn)||b.nameEn||b.nameFa||b.code}
function readCookie(){if(typeof document==="undefined")return"";const hit=document.cookie.split(";").map(x=>x.trim()).find(x=>x.startsWith("hd_branch="));return hit?decodeURIComponent(hit.slice("hd_branch=".length)):""}
function writeCookie(id:string){document.cookie=`hd_branch=${encodeURIComponent(id)}; Path=/; Max-Age=31536000; SameSite=Lax`}
export function BranchSwitcher(){const locale=useLocale(),router=useRouter(),[branches,setBranches]=useState<Branch[]>([]),[selected,setSelected]=useState("");useEffect(()=>{let active=true;fetch("/api/store-locations",{headers:{accept:"application/json"}}).then(r=>r.ok?r.json():{branches:[]}).then(data=>{if(!active)return;const rows=Array.isArray(data?.branches)?data.branches:[];setBranches(rows);const current=readCookie(),valid=rows.some((b:Branch)=>b.id===current)?current:"",fallback=(rows.find((b:Branch)=>b.isDefault)||rows[0])?.id||"";const next=valid||fallback;setSelected(next);if(next&&next!==current)writeCookie(next)}).catch(()=>{});return()=>{active=false}},[]);if(branches.length<2)return null;return <label className="hidden h-10 items-center gap-1.5 rounded-full border border-[#c4c6d0]/60 bg-white px-2.5 text-[#001736] shadow-sm lg:flex"><MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true"/><select aria-label={locale==="fa"?"انتخاب شعبه":locale==="tr"?"Şube seç":locale==="ar"?"اختر الفرع":"Select branch"} value={selected} onChange={e=>{const id=e.target.value;setSelected(id);writeCookie(id);router.refresh()}} className="max-w-36 bg-transparent text-[11px] font-black outline-none">{branches.map(b=><option key={b.id} value={b.id}>{name(b,locale)}</option>)}</select></label>}
