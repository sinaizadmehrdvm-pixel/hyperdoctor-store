import Link from "next/link";
import { Plus, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DeleteButton } from "@/components/admin/delete-button";
import { deletePage } from "./actions";
import { adminRpc } from "@/lib/admin-data";
import { currentAdminLocale } from "@/lib/admin-locale-server";
import { adminNumber, adminStatusText, type AdminLocale } from "@/lib/admin-i18n";

type PageRow={id:string;slug:string;titleFa:string;titleTr:string;titleEn:string;titleAr:string;isPublished:boolean;showInNav:boolean;navOrder:number;template:string};
const c:Record<AdminLocale,Record<string,string>>={fa:{eyebrow:"مدیریت محتوا",title:"صفحات سایت",new:"صفحه جدید",name:"عنوان",path:"مسیر",template:"قالب",nav:"منو",status:"وضعیت",yes:"بله",no:"خیر",empty:"هنوز صفحه‌ای ثبت نشده است."},ar:{eyebrow:"إدارة المحتوى",title:"صفحات الموقع",new:"صفحة جديدة",name:"العنوان",path:"المسار",template:"القالب",nav:"القائمة",status:"الحالة",yes:"نعم",no:"لا",empty:"لا توجد صفحات مسجلة بعد."},en:{eyebrow:"Content Management",title:"Site pages",new:"New page",name:"Title",path:"Path",template:"Template",nav:"Navigation",status:"Status",yes:"Yes",no:"No",empty:"No page has been registered yet."},tr:{eyebrow:"İçerik Yönetimi",title:"Site sayfaları",new:"Yeni sayfa",name:"Başlık",path:"Yol",template:"Şablon",nav:"Menü",status:"Durum",yes:"Evet",no:"Hayır",empty:"Henüz sayfa kaydedilmedi."}};

export default async function AdminPagesPage() {
  const [pages,l] = await Promise.all([adminRpc<PageRow[]>("admin_pages_bundle"),currentAdminLocale()]); const t=c[l];
  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div><p className="text-xs font-black uppercase tracking-[.16em] text-muted">{t.eyebrow}</p><h1 className="mt-2 text-2xl font-black text-foreground">{t.title}</h1></div>
        <Link href="/admin/pages/new" className="flex min-h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-black text-white hover:bg-primary/90"><Plus className="h-4 w-4"/>{t.new}</Link>
      </div>
      <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full text-sm"><thead><tr className="border-b border-border text-xs text-muted"><th className="px-4 py-3 text-start">{t.name}</th><th className="px-4 py-3 text-start">{t.path}</th><th className="px-4 py-3 text-start">{t.template}</th><th className="px-4 py-3 text-start">{t.nav}</th><th className="px-4 py-3 text-start">{t.status}</th><th className="px-4 py-3"/></tr></thead>
        <tbody>{pages.map(p=><tr key={p.id} className="border-b border-border last:border-0"><td className="px-4 py-3"><div className="font-bold text-foreground">{p.titleFa || p.titleEn}</div><div className="mt-1 text-xs text-muted">{p.titleTr || "—"} · {p.titleAr || "—"}</div></td><td className="px-4 py-3 text-muted" dir="ltr">/{p.slug}</td><td className="px-4 py-3 text-muted">{p.template}</td><td className="px-4 py-3 text-muted">{p.showInNav?`${t.yes} · ${adminNumber(p.navOrder,l)}`:t.no}</td><td className="px-4 py-3"><Badge variant={p.isPublished?"success":"muted"}>{adminStatusText(p.isPublished?"PUBLISHED":"DRAFT",l)}</Badge></td><td className="px-4 py-3"><div className="flex justify-end gap-1"><Link href={`/admin/pages/${p.id}`} className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-muted-bg"><Pencil className="h-4 w-4"/></Link><DeleteButton action={deletePage.bind(null,p.id)}/></div></td></tr>)}{pages.length===0?<tr><td colSpan={6} className="px-4 py-12 text-center text-muted">{t.empty}</td></tr>:null}</tbody></table>
      </div>
    </div>
  );
}
