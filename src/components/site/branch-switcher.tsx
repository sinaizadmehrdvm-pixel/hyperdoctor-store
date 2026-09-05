"use client";

import {useEffect,useState} from "react";
import {useLocale} from "next-intl";
import {useRouter} from "next/navigation";
import {MapPin} from "lucide-react";
import {emitStoreBranchChanged,readStoreBranchCookie,writeStoreBranchCookie} from "@/lib/store-branch-client";

type Branch={id:string;code:string;nameFa:string;nameTr:string;nameEn:string;nameAr:string;countryCode:string;currency:string;isDefault:boolean;warehouseCount:number;sellableUnits:number};
function name(b:Branch,locale:string){return(locale==="fa"?b.nameFa:locale==="tr"?b.nameTr:locale==="ar"?b.nameAr:b.nameEn)||b.nameEn||b.nameFa||b.code}

export function BranchSwitcher(){
 const locale=useLocale(),router=useRouter(),[branches,setBranches]=useState<Branch[]>([]),[selected,setSelected]=useState("");
 useEffect(()=>{let active=true;fetch("/api/store-locations",{headers:{accept:"application/json"},cache:"no-store"}).then(r=>r.ok?r.json():{branches:[]}).then(data=>{if(!active)return;const rows=Array.isArray(data?.branches)?data.branches:[];setBranches(rows);const current=readStoreBranchCookie(),valid=rows.some((b:Branch)=>b.id===current)?current:"",fallback=(rows.find((b:Branch)=>b.isDefault)||rows[0])?.id||"",next=valid||fallback;setSelected(next);if(next&&next!==current){writeStoreBranchCookie(next);emitStoreBranchChanged(next)}}).catch(()=>{});return()=>{active=false}},[]);
 if(!branches.length)return null;
 const currentBranch=branches.find(b=>b.id===selected)??branches[0];
 if(branches.length===1)return <span className="hidden h-10 items-center gap-1.5 rounded-full border border-[#c4c6d0]/60 bg-white px-3 text-[11px] font-black text-[#001736] shadow-sm lg:flex"><MapPin className="h-3.5 w-3.5" aria-hidden="true"/>{name(currentBranch,locale)}</span>;
 return <label className="hidden h-10 items-center gap-1.5 rounded-full border border-[#c4c6d0]/60 bg-white px-2.5 text-[#001736] shadow-sm lg:flex"><MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true"/><select aria-label={locale==="fa"?"انتخاب شعبه":locale==="tr"?"Şube seç":locale==="ar"?"اختر الفرع":"Select branch"} value={selected} onChange={e=>{const id=e.target.value;if(id===selected)return;setSelected(id);writeStoreBranchCookie(id);emitStoreBranchChanged(id);router.refresh()}} className="max-w-36 bg-transparent text-[11px] font-black outline-none">{branches.map(b=><option key={b.id} value={b.id}>{name(b,locale)}</option>)}</select></label>;
}
