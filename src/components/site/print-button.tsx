"use client";

import {Printer} from "lucide-react";

export function PrintButton({label}:{label:string}){return <button type="button" onClick={()=>window.print()} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#001736] px-4 text-xs font-black text-white"><Printer className="h-4 w-4"/>{label}</button>}
