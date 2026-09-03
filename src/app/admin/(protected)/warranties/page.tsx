import { CalendarDays, Mail, Phone, Search, ShieldCheck } from "lucide-react";
import { adminRpc } from "@/lib/admin-data";
import { currentAdminLocale } from "@/lib/admin-locale-server";
import { adminDate, adminNumber, adminStatusText, type AdminLocale } from "@/lib/admin-i18n";
import { updateWarranty } from "./actions";

type Warranty = {
  id: string;
  serialNumber: string;
  orderNumber: string;
  startsAt: string;
  expiresAt: string;
  status: "ACTIVE" | "EXPIRED" | "SUSPENDED" | "REPLACED";
  notes: string;
  guestName?: string | null;
  guestPhone?: string | null;
  guestEmail?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  customerEmail?: string | null;
  productNameFa: string;
  productNameTr: string;
  productNameEn: string;
  productNameAr: string;
  sku: string;
  locale: string;
};

type Copy = {
  eyebrow: string;
  title: string;
  item: string;
  customer: string;
  note: string;
  save: string;
  start: string;
  end: string;
  order: string;
  empty: string;
  searchPlaceholder: string;
  search: string;
  sku: string;
};

const copy: Record<AdminLocale, Copy> = {
  fa: {
    eyebrow: "عملیات گارانتی",
    title: "مدیریت گارانتی",
    item: "مورد",
    customer: "مشتری",
    note: "یادداشت داخلی گارانتی",
    save: "ذخیره تغییرات",
    start: "شروع",
    end: "پایان",
    order: "شماره سفارش",
    empty: "گارانتی ثبت‌شده‌ای با این معیار وجود ندارد.",
    searchPlaceholder: "جستجو با سریال، سفارش، مشتری یا نام محصول...",
    search: "جستجو",
    sku: "شناسه کالا",
  },
  ar: {
    eyebrow: "عمليات الضمان",
    title: "إدارة الضمان",
    item: "حالة",
    customer: "العميل",
    note: "ملاحظة ضمان داخلية",
    save: "حفظ التغييرات",
    start: "البداية",
    end: "النهاية",
    order: "رقم الطلب",
    empty: "لا توجد ضمانات مطابقة لهذه المعايير.",
    searchPlaceholder: "ابحث بالرقم التسلسلي أو الطلب أو العميل أو اسم المنتج...",
    search: "بحث",
    sku: "رمز المنتج",
  },
  en: {
    eyebrow: "Warranty operations",
    title: "Warranty management",
    item: "items",
    customer: "Customer",
    note: "Internal warranty note",
    save: "Save changes",
    start: "Start",
    end: "End",
    order: "Order number",
    empty: "No warranties match these criteria.",
    searchPlaceholder: "Search serial, order, customer or product name...",
    search: "Search",
    sku: "SKU",
  },
  tr: {
    eyebrow: "Garanti işlemleri",
    title: "Garanti yönetimi",
    item: "kayıt",
    customer: "Müşteri",
    note: "Dahili garanti notu",
    save: "Değişiklikleri kaydet",
    start: "Başlangıç",
    end: "Bitiş",
    order: "Sipariş no",
    empty: "Bu kriterlere uyan garanti kaydı yok.",
    searchPlaceholder: "Seri no, sipariş, müşteri veya ürün adıyla ara...",
    search: "Ara",
    sku: "SKU",
  },
};

const statuses: Warranty["status"][] = ["ACTIVE", "EXPIRED", "SUSPENDED", "REPLACED"];

function productName(w: Warranty, locale: AdminLocale) {
  const localized = {
    fa: w.productNameFa,
    tr: w.productNameTr,
    en: w.productNameEn,
    ar: w.productNameAr,
  }[locale];
  return localized || w.productNameEn || w.productNameFa || w.productNameTr || w.productNameAr || "—";
}

export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const [{ q = "" }, locale] = await Promise.all([searchParams, currentAdminLocale()]);
  const warranties = await adminRpc<Warranty[]>("admin_warranties", { p_search: q.trim() });
  const t = copy[locale];

  return (
    <div className="mx-auto max-w-[1450px] space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[.18em] text-[#e80346]">{t.eyebrow}</p>
          <h1 className="mt-2 text-3xl font-black text-[#001736]">{t.title}</h1>
        </div>
        <span className="text-sm font-bold text-[#747780]">{adminNumber(warranties.length, locale)} {t.item}</span>
      </div>

      <form className="grid gap-3 rounded-[1.5rem] border border-[#e2e6eb] bg-white p-4 shadow-sm sm:grid-cols-[1fr_auto]">
        <label className="relative">
          <Search className="pointer-events-none absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9a9da5]" />
          <input
            name="q"
            defaultValue={q}
            placeholder={t.searchPlaceholder}
            className="h-11 w-full rounded-xl border border-[#dfe4ea] bg-[#f7fafd] ps-11 pe-4 text-sm outline-none focus:border-[#009dd8]"
          />
        </label>
        <button className="h-11 rounded-xl bg-[#001736] px-5 text-xs font-black text-white">{t.search}</button>
      </form>

      <div className="grid gap-4 xl:grid-cols-2">
        {warranties.map((w) => {
          const name = w.customerName || w.guestName || t.customer;
          const phone = w.customerPhone || w.guestPhone;
          const email = w.customerEmail || w.guestEmail;

          return (
            <article key={w.id} className="rounded-[1.6rem] border border-[#e2e6eb] bg-white p-5 shadow-sm">
              <div className="flex flex-col justify-between gap-4 sm:flex-row">
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <ShieldCheck className="h-5 w-5 text-[#009dd8]" />
                    <span dir="ltr" className="rounded-lg bg-[#edf4ff] px-2 py-1 font-mono font-black text-[#002b5b]">{w.serialNumber}</span>
                    <span dir="ltr" className="rounded-lg bg-[#f1f4f7] px-2 py-1 font-black uppercase text-[#747780]">{w.locale}</span>
                  </div>
                  <h2 className="mt-3 text-lg font-black text-[#001736]">{productName(w, locale)}</h2>
                  <p className="mt-1 text-sm text-[#747780]">{name} · {t.sku}: <span dir="ltr">{w.sku}</span></p>
                </div>

                <form action={updateWarranty.bind(null, w.id)} className="grid min-w-[250px] gap-2">
                  <select name="status" defaultValue={w.status} className="h-10 rounded-xl border border-[#dfe4ea] bg-white px-3 text-xs font-bold">
                    {statuses.map((status) => <option key={status} value={status}>{adminStatusText(status, locale)}</option>)}
                  </select>
                  <textarea name="notes" defaultValue={w.notes} placeholder={t.note} rows={3} className="rounded-xl border border-[#dfe4ea] bg-white p-3 text-sm outline-none focus:border-[#009dd8]" />
                  <button className="rounded-xl bg-[#e80346] px-3 py-2.5 text-xs font-black text-white">{t.save}</button>
                </form>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-[#edf0f2] bg-[#fafcff] p-3"><CalendarDays className="mb-2 h-4 w-4 text-[#009dd8]" /><span className="block text-xs text-[#747780]">{t.start}</span><b className="mt-1 block text-sm text-[#001736]">{adminDate(w.startsAt, locale)}</b></div>
                <div className="rounded-xl border border-[#edf0f2] bg-[#fafcff] p-3"><CalendarDays className="mb-2 h-4 w-4 text-[#009dd8]" /><span className="block text-xs text-[#747780]">{t.end}</span><b className="mt-1 block text-sm text-[#001736]">{adminDate(w.expiresAt, locale)}</b></div>
                <div className="rounded-xl border border-[#edf0f2] bg-[#fafcff] p-3"><span className="block text-xs text-[#747780]">{t.order}</span><b dir="ltr" className="mt-1 block text-sm text-[#001736]">{w.orderNumber || "—"}</b></div>
              </div>

              {(phone || email) && <div className="mt-4 flex flex-wrap gap-3 text-xs text-[#5f6570]">
                {phone ? <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-[#009dd8]" /><span dir="ltr">{phone}</span></p> : null}
                {email ? <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-[#009dd8]" /><span dir="ltr">{email}</span></p> : null}
              </div>}
            </article>
          );
        })}

        {!warranties.length ? <div className="rounded-[1.6rem] border border-dashed border-[#cfd5dc] bg-white p-12 text-center text-sm text-[#8a8e96] xl:col-span-2">{t.empty}</div> : null}
      </div>
    </div>
  );
}
