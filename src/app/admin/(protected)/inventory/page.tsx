import { AlertTriangle, Boxes, PackageCheck } from "lucide-react";
import { adminRpc } from "@/lib/admin-data";
import { adjustStock } from "./actions";

type Movement = { delta: number; reason: string; note: string; createdAt: string };
type ProductStock = {
  id: string;
  sku: string;
  nameFa: string;
  nameEn: string;
  brand: string;
  stock: number;
  lowStockThreshold: number;
  isPublished: boolean;
  movements: Movement[];
};
type InventoryBundle = { products: ProductStock[]; totalStock: number; lowStock: number };

export default async function AdminInventoryPage() {
  const data = await adminRpc<InventoryBundle>("admin_inventory", { p_search: "" });
  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div><p className="text-xs font-black uppercase tracking-[.16em] text-muted">Inventory Control</p><h1 className="mt-2 text-2xl font-black text-foreground">مدیریت موجودی</h1></div>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5"><Boxes className="h-5 w-5 text-primary"/><div className="mt-3 text-2xl font-black">{new Intl.NumberFormat("fa-IR").format(data.totalStock)}</div><div className="text-sm text-muted">کل موجودی ثبت‌شده</div></div>
        <div className="rounded-2xl border border-border bg-card p-5"><AlertTriangle className="h-5 w-5 text-accent"/><div className="mt-3 text-2xl font-black">{new Intl.NumberFormat("fa-IR").format(data.lowStock)}</div><div className="text-sm text-muted">کالاهای کم‌موجودی</div></div>
      </div>

      <div className="mt-6 space-y-4">
        {data.products.map((p) => {
          const action = adjustStock.bind(null, p.id);
          const low = p.stock <= p.lowStockThreshold;
          return <article key={p.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-start">
              <div>
                <div className="flex items-center gap-2 text-primary"><PackageCheck className="h-4 w-4"/><span className="text-xs font-black" dir="ltr">{p.sku}</span></div>
                <h2 className="mt-2 text-lg font-black text-foreground">{p.nameFa || p.nameEn}</h2>
                <p className="mt-1 text-xs text-muted">{p.brand || "بدون برند"} · آستانه هشدار {new Intl.NumberFormat("fa-IR").format(p.lowStockThreshold)}</p>
              </div>
              <div className={`rounded-xl px-4 py-3 text-center ${low ? "bg-accent/10 text-accent" : "bg-primary/10 text-primary"}`}><div className="text-2xl font-black">{new Intl.NumberFormat("fa-IR").format(p.stock)}</div><div className="text-xs font-bold">موجودی فعلی</div></div>
            </div>

            <form action={action} className="mt-5 grid gap-3 md:grid-cols-[120px_160px_1fr_auto]">
              <input name="delta" type="number" step="1" required placeholder="+10 / -2" className="h-11 rounded-xl border border-border bg-background px-3 text-sm" />
              <select name="reason" className="h-11 rounded-xl border border-border bg-background px-3 text-sm"><option value="PURCHASE">خرید/ورود</option><option value="SALE_ADJUSTMENT">اصلاح فروش</option><option value="RETURN">مرجوعی</option><option value="DAMAGED">آسیب‌دیده</option><option value="MANUAL">اصلاح دستی</option></select>
              <input name="note" placeholder="یادداشت اختیاری" className="h-11 rounded-xl border border-border bg-background px-3 text-sm" />
              <button className="h-11 rounded-xl bg-primary px-5 text-sm font-black text-white">اعمال</button>
            </form>

            {p.movements.length ? <div className="mt-4 overflow-x-auto rounded-xl border border-border"><table className="w-full text-xs"><thead><tr className="bg-muted-bg text-muted"><th className="px-3 py-2 text-start">تغییر</th><th className="px-3 py-2 text-start">علت</th><th className="px-3 py-2 text-start">یادداشت</th><th className="px-3 py-2 text-start">زمان</th></tr></thead><tbody>{p.movements.map((m,i)=><tr key={`${m.createdAt}-${i}`} className="border-t border-border"><td className={`px-3 py-2 font-black ${m.delta>0?"text-primary":"text-accent"}`} dir="ltr">{m.delta>0?`+${m.delta}`:m.delta}</td><td className="px-3 py-2">{m.reason}</td><td className="px-3 py-2">{m.note || "—"}</td><td className="px-3 py-2">{new Date(m.createdAt).toLocaleString("fa-IR")}</td></tr>)}</tbody></table></div> : null}
          </article>;
        })}
        {data.products.length === 0 ? <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center text-sm text-muted">هنوز محصولی برای مدیریت موجودی وجود ندارد.</div> : null}
      </div>
    </div>
  );
}
