"use client";
import { useRouter } from "next/navigation";
export type AdminLocale="fa"|"ar"|"en"|"tr";
const names:Record<AdminLocale,string>={fa:"فارسی",ar:"العربية",en:"English",tr:"Türkçe"};
const labels:Record<AdminLocale,string>={fa:"زبان پنل مدیریت",ar:"لغة لوحة الإدارة",en:"Admin panel language",tr:"Yönetim paneli dili"};
export function AdminLocaleSwitcher({locale}:{locale:AdminLocale}){const router=useRouter();return <label className="inline-flex items-center"><span className="sr-only">{labels[locale]}</span><select aria-label={labels[locale]} value={locale} onChange={e=>{const next=e.target.value as AdminLocale;const dir=next==="fa"||next==="ar"?"rtl":"ltr";document.cookie=`hd_admin_locale=${next}; Path=/admin; Max-Age=31536000; SameSite=Lax`;document.documentElement.lang=next;document.documentElement.dir=dir;router.refresh();}} className="h-10 rounded-xl border border-[#e0e3e6] bg-white px-2 text-xs font-black text-[#001736] outline-none">{(Object.keys(names) as AdminLocale[]).map(x=><option key={x} value={x}>{names[x]}</option>)}</select></label>}
