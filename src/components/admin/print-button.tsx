"use client";
import { Printer } from "lucide-react";
export function PrintButton({label}:{label:string}){return <button type="button" onClick={()=>window.print()} className="print:hidden inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#001736] px-4 text-xs font-black text-white"><Printer className="h-4 w-4" aria-hidden="true"/>{label}</button>}
