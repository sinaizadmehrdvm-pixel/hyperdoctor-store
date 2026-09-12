import Link from "next/link";
import { Blocks, Eye, Library, ShieldCheck } from "lucide-react";
import { currentAdminLocale } from "@/lib/admin-locale-server";

const labels = {
  fa: {tools:"ابزارهای ویرایشگر بصری",blocks:"بلوک‌ها",quality:"کنترل کیفیت",preview:"پیش‌نمایش پیش‌نویس",templates:"الگوها"},
  tr: {tools:"Görsel düzenleyici araçları",blocks:"Bloklar",quality:"Kalite kontrolü",preview:"Taslak önizleme",templates:"Şablonlar"},
  en: {tools:"Visual editor tools",blocks:"Blocks",quality:"Quality",preview:"Draft preview",templates:"Templates"},
  ar: {tools:"أدوات المحرر المرئي",blocks:"الكتل",quality:"فحص الجودة",preview:"معاينة المسودة",templates:"القوالب"},
} as const;

export default async function EditorToolsLayout({children,params}:{children:React.ReactNode;params:Promise<{id:string}>}){
 const [{id},locale]=await Promise.all([params,currentAdminLocale()]);
 const t=labels[locale];
 const rtl=locale==="fa"||locale==="ar";
 return <>{children}<nav dir={rtl?"rtl":"ltr"} className="fixed bottom-4 left-1/2 z-[110] flex -translate-x-1/2 items-center gap-1 rounded-2xl border border-slate-200 bg-white/95 p-1.5 shadow-[0_14px_50px_rgba(0,23,54,.22)] backdrop-blur" aria-label={t.tools}>
  <Link href={`/admin/editor/${id}/sections`} title={t.blocks} className="flex h-10 items-center gap-2 rounded-xl px-3 text-xs font-black text-violet-700 hover:bg-violet-50"><Blocks className="h-4 w-4"/><span className="hidden md:inline">{t.blocks}</span></Link>
  <Link href={`/admin/editor/${id}/quality`} title={t.quality} className="flex h-10 items-center gap-2 rounded-xl px-3 text-xs font-black text-emerald-700 hover:bg-emerald-50"><ShieldCheck className="h-4 w-4"/><span className="hidden md:inline">{t.quality}</span></Link>
  <Link href={`/admin/editor/${id}/preview`} title={t.preview} className="flex h-10 items-center gap-2 rounded-xl bg-amber-50 px-3 text-xs font-black text-amber-800 ring-1 ring-amber-200 hover:bg-amber-100"><Eye className="h-4 w-4"/><span className="hidden md:inline">{t.preview}</span></Link>
  <Link href={`/admin/editor/${id}/templates`} title={t.templates} className="flex h-10 items-center gap-2 rounded-xl px-3 text-xs font-black text-sky-700 hover:bg-sky-50"><Library className="h-4 w-4"/><span className="hidden md:inline">{t.templates}</span></Link>
 </nav></>;
}
