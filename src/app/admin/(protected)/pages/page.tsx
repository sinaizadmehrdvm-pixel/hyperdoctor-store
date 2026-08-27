import Link from "next/link";
import { Plus, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DeleteButton } from "@/components/admin/delete-button";
import { deletePage } from "./actions";
import { adminRpc } from "@/lib/admin-data";

type PageRow={id:string;slug:string;titleFa:string;titleTr:string;titleEn:string;titleAr:string;isPublished:boolean;showInNav:boolean;navOrder:number;template:string};

export default async function AdminPagesPage() {
  const pages = await adminRpc<PageRow[]>("admin_pages_bundle");
  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div><p className="text-xs font-black uppercase tracking-[.16em] text-muted">Content Management</p><h1 className="mt-2 text-2xl font-black text-foreground">صفحات سایت</h1></div>
        <Link href="/admin/pages/new" className="flex min-h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-black text-white hover:bg-primary/90"><Plus className="h-4 w-4"/>صفحه جدید</Link>
      </div>
      <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full text-sm"><thead><tr className="border-b border-border text-xs text-muted"><th className="px-4 py-3 text-start">عنوان</th><th className="px-4 py-3 text-start">مسیر</th><th className="px-4 py-3 text-start">قالب</th><th className="px-4 py-3 text-start">منو</th><th className="px-4 py-3 text-start">وضعیت</th><th className="px-4 py-3"/></tr></thead>
        <tbody>{pages.map(p=><tr key={p.id} className="border-b border-border last:border-0"><td className="px-4 py-3"><div className="font-bold text-foreground">{p.titleFa || p.titleEn}</div><div className="mt-1 text-xs text-muted">{p.titleTr || "—"} · {p.titleAr || "—"}</div></td><td className="px-4 py-3 text-muted" dir="ltr">/{p.slug}</td><td className="px-4 py-3 text-muted">{p.template}</td><td className="px-4 py-3 text-muted">{p.showInNav?`بله · ${p.navOrder}`:"خیر"}</td><td className="px-4 py-3"><Badge variant={p.isPublished?"success":"muted"}>{p.isPublished?"منتشر شده":"پیش‌نویس"}</Badge></td><td className="px-4 py-3"><div className="flex justify-end gap-1"><Link href={`/admin/pages/${p.id}`} className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-muted-bg"><Pencil className="h-4 w-4"/></Link><DeleteButton action={deletePage.bind(null,p.id)}/></div></td></tr>)}{pages.length===0?<tr><td colSpan={6} className="px-4 py-12 text-center text-muted">هنوز صفحه‌ای ثبت نشده است.</td></tr>:null}</tbody></table>
      </div>
    </div>
  );
}
