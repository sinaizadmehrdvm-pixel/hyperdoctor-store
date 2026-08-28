"use client";

import { useState } from "react";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";

export function PasswordField({name,required=false,minLength,maxLength,autoComplete,showLabel,hideLabel}:{name:string;required?:boolean;minLength?:number;maxLength?:number;autoComplete:string;showLabel:string;hideLabel:string}){
 const [visible,setVisible]=useState(false);
 return <div className="flex h-14 items-center gap-3 rounded-xl border-2 border-[#747780] bg-white px-4 focus-within:border-[#001736]">
  <LockKeyhole className="h-5 w-5 shrink-0 text-[#001736]"/>
  <input name={name} type={visible?"text":"password"} required={required} minLength={minLength} maxLength={maxLength} autoComplete={autoComplete} dir="ltr" className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none"/>
  <button type="button" onClick={()=>setVisible(v=>!v)} aria-label={visible?hideLabel:showLabel} aria-pressed={visible} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#181c1e] transition hover:bg-[#edf4ff] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#001736]">
   {visible?<EyeOff className="h-5 w-5"/>:<Eye className="h-5 w-5"/>}
  </button>
 </div>;
}
