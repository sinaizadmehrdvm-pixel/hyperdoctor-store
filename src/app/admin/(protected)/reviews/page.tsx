import { Star } from "lucide-react";
import { adminRpc } from "@/lib/admin-data";
import { updateReview } from "./actions";

type Review = {
  id: string;
  authorName: string;
  rating: number;
  title: string;
  body: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  isVerified: boolean;
  createdAt: string;
  productNameFa: string;
  productNameEn: string;
  sku: string;
};
const STATUS = { PENDING: "در انتظار", APPROVED: "تأیید شده", REJECTED: "رد شده" } as const;

export default async function AdminReviewsPage() {
  const reviews = await adminRpc<Review[]>("admin_reviews");
  return <div>
    <div className="flex items-end justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[.16em] text-muted">Review Moderation</p><h1 className="mt-2 text-2xl font-black text-foreground">نظرات کاربران</h1></div><span className="rounded-xl border border-border bg-card px-3 py-2 text-xs font-bold text-muted">{new Intl.NumberFormat("fa-IR").format(reviews.length)} نظر</span></div>
    <div className="mt-6 grid gap-4 xl:grid-cols-2">
      {reviews.map(r => { const action = updateReview.bind(null,r.id); return <article key={r.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div><div className="flex items-center gap-1 text-amber-500">{Array.from({length:5}).map((_,i)=><Star key={i} className={`h-4 w-4 ${i<r.rating?"fill-current":""}`}/>)}</div><h2 className="mt-2 font-black text-foreground">{r.productNameFa || r.productNameEn}</h2><p className="mt-1 text-xs text-muted">{r.authorName} · SKU <span dir="ltr">{r.sku}</span> · {new Date(r.createdAt).toLocaleDateString("fa-IR")}</p></div>
        <form action={action} className="space-y-2 rounded-xl border border-border bg-background p-3"><select name="status" defaultValue={r.status} className="h-9 rounded-lg border border-border bg-card px-3 text-xs font-bold">{Object.entries(STATUS).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select><label className="flex items-center gap-2 text-xs"><input type="checkbox" name="isVerified" defaultChecked={r.isVerified}/> خرید تأییدشده</label><button className="h-9 w-full rounded-lg bg-primary px-3 text-xs font-black text-white">ذخیره</button></form></div>
        {r.title ? <h3 className="mt-4 font-bold text-foreground">{r.title}</h3> : null}<p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-muted">{r.body || "بدون متن"}</p>
      </article>; })}
      {reviews.length===0?<div className="xl:col-span-2 rounded-2xl border border-dashed border-border bg-card p-12 text-center text-sm text-muted">هنوز نظری ثبت نشده است.</div>:null}
    </div>
  </div>;
}
