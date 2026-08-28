"use client";

import { useActionState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import type { AdminLocale } from "@/lib/admin-i18n";
import { upsertProduct, type ProductActionState } from "@/app/admin/(protected)/products/actions";

const copy:Record<AdminLocale,{save:string;saving:string}>={fa:{save:"ذخیره محصول",saving:"در حال ذخیره..."},ar:{save:"حفظ المنتج",saving:"جارٍ الحفظ..."},en:{save:"Save product",saving:"Saving..."},tr:{save:"Ürünü kaydet",saving:"Kaydediliyor..."}};
const initialState:ProductActionState={error:null};

export function ProductFormShell({locale,children}:{locale:AdminLocale;children:React.ReactNode}){
 const[state,action,pending]=useActionState(upsertProduct,initialState);const t=copy[locale];
 return <form action={action} className="max-w-7xl space-y-5 pb-20" aria-busy={pending}>{state.error?<div role="alert" aria-live="assertive" className="flex items-start gap-3 rounded-2xl border border-[#f1b7c8] bg-[#fff4f7] p-4 text-sm font-bold text-[#920028]"><AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true"/><span>{state.error}</span></div>:null}{children}<div className="sticky bottom-4 z-20 flex justify-end"><button type="submit" disabled={pending} className="vitalis-focus inline-flex min-h-12 min-w-36 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#ba0036] px-8 text-sm font-black text-white shadow-[0_16px_35px_rgba(186,0,54,.22)] transition hover:bg-[#e80346] disabled:cursor-wait disabled:opacity-65">{pending?<Loader2 className="h-4 w-4 animate-spin" aria-hidden="true"/>:null}{pending?t.saving:t.save}</button></div></form>
}
