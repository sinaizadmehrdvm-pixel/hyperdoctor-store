import Image from "next/image";
import { adminRpc } from "@/lib/admin-data";
import { MediaUploader } from "@/components/admin/media-uploader";
import { DeleteButton } from "@/components/admin/delete-button";
import { deleteMedia } from "./actions";

type MediaRow={id:string;url:string;altFa:string;altTr:string;altEn:string;altAr:string;width?:number|null;height?:number|null;createdAt:string};

export default async function AdminMediaPage(){
  const media=await adminRpc<MediaRow[]>("admin_media_bundle");
  return <div>
    <div className="flex items-center justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[.16em] text-muted">Asset Library</p><h1 className="mt-2 text-2xl font-black text-foreground">رسانه‌ها</h1></div><MediaUploader/></div>
    <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">{media.map(m=><article key={m.id} className="group overflow-hidden rounded-2xl border border-border bg-card shadow-sm"><div className="relative aspect-square bg-muted-bg"><Image src={m.url} alt={m.altFa||m.altEn||"media"} fill className="object-cover"/></div><div className="flex items-center justify-between gap-2 p-2"><div className="min-w-0"><p className="truncate text-[11px] font-bold text-foreground">{m.altFa||"بدون عنوان"}</p><p className="truncate text-[9px] text-muted" dir="ltr">{m.width&&m.height?`${m.width}×${m.height}`:new Date(m.createdAt).toLocaleDateString("fa-IR")}</p></div><DeleteButton action={deleteMedia.bind(null,m.id)} confirmMessage="این تصویر حذف شود؟"/></div></article>)}{media.length===0?<p className="col-span-full rounded-2xl border border-dashed border-border p-12 text-center text-sm text-muted">هنوز تصویری ثبت نشده است.</p>:null}</div>
  </div>;
}
