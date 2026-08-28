import { getLocale } from "next-intl/server";
import { CheckCircle2, Clock3, LifeBuoy, Search, ShieldCheck } from "lucide-react";
import { Container } from "@/components/ui/container";
import { supabaseRpc } from "@/lib/supabase-rest";

type Ticket = { ticketNo:string; subject:string; category:string; priority:string; status:string; createdAt:string; updatedAt:string };
type Locale = "fa" | "tr" | "ar" | "en";

const valueCopy: Record<Locale, { statuses: Record<string,string>; priorities: Record<string,string>; categories: Record<string,string> }> = {
  fa: {
    statuses: { OPEN:"باز", IN_PROGRESS:"در حال بررسی", WAITING_CUSTOMER:"در انتظار پاسخ مشتری", RESOLVED:"حل‌شده", CLOSED:"بسته‌شده" },
    priorities: { NORMAL:"عادی", HIGH:"مهم", URGENT:"اورژانسی" },
    categories: { TECHNICAL:"مشکل فنی دستگاه", RESPIRATORY:"خدمات تنفسی", WARRANTY:"گارانتی و خدمات پس از فروش", INSTALLATION:"نصب و راه‌اندازی", GENERAL:"سایر موارد" },
  },
  tr: {
    statuses: { OPEN:"Açık", IN_PROGRESS:"İnceleniyor", WAITING_CUSTOMER:"Müşteri yanıtı bekleniyor", RESOLVED:"Çözüldü", CLOSED:"Kapatıldı" },
    priorities: { NORMAL:"Normal", HIGH:"Yüksek", URGENT:"Acil" },
    categories: { TECHNICAL:"Teknik cihaz sorunu", RESPIRATORY:"Solunum hizmetleri", WARRANTY:"Garanti ve satış sonrası", INSTALLATION:"Kurulum", GENERAL:"Diğer" },
  },
  ar: {
    statuses: { OPEN:"مفتوح", IN_PROGRESS:"قيد المراجعة", WAITING_CUSTOMER:"بانتظار رد العميل", RESOLVED:"تم الحل", CLOSED:"مغلق" },
    priorities: { NORMAL:"عادي", HIGH:"مهم", URGENT:"عاجل" },
    categories: { TECHNICAL:"مشكلة فنية", RESPIRATORY:"خدمات التنفس", WARRANTY:"الضمان وما بعد البيع", INSTALLATION:"التركيب", GENERAL:"أخرى" },
  },
  en: {
    statuses: { OPEN:"Open", IN_PROGRESS:"In progress", WAITING_CUSTOMER:"Waiting for customer", RESOLVED:"Resolved", CLOSED:"Closed" },
    priorities: { NORMAL:"Normal", HIGH:"High", URGENT:"Urgent" },
    categories: { TECHNICAL:"Technical device issue", RESPIRATORY:"Respiratory services", WARRANTY:"Warranty & after-sales", INSTALLATION:"Installation", GENERAL:"Other" },
  },
};

export default async function SupportStatusPage({ searchParams }: { searchParams: Promise<{ ticket?:string; token?:string }> }) {
  const [rawLocale, query] = await Promise.all([getLocale(), searchParams]);
  const locale: Locale = rawLocale === "fa" || rawLocale === "tr" || rawLocale === "ar" ? rawLocale : "en";
  const copy = locale === "fa" ? { title:"پیگیری درخواست پشتیبانی", body:"شماره تیکت و شناسه امنی که هنگام ثبت درخواست دریافت کرده‌اید وارد کنید.", ticket:"شماره تیکت", token:"شناسه امن", search:"بررسی وضعیت", notFound:"درخواستی با این اطلاعات پیدا نشد.", status:"وضعیت", priority:"اولویت", category:"دسته‌بندی", created:"زمان ثبت", updated:"آخرین بروزرسانی" } : locale === "tr" ? { title:"Destek talebi takibi", body:"Kayıt sırasında aldığınız destek numarasını ve güvenli kimliği girin.", ticket:"Destek no", token:"Güvenli kimlik", search:"Durumu kontrol et", notFound:"Bu bilgilerle eşleşen kayıt bulunamadı.", status:"Durum", priority:"Öncelik", category:"Kategori", created:"Oluşturma", updated:"Son güncelleme" } : locale === "ar" ? { title:"متابعة طلب الدعم", body:"أدخل رقم التذكرة والمعرف الآمن اللذين حصلت عليهما عند التسجيل.", ticket:"رقم التذكرة", token:"المعرف الآمن", search:"عرض الحالة", notFound:"لم يتم العثور على طلب بهذه المعلومات.", status:"الحالة", priority:"الأولوية", category:"التصنيف", created:"تاريخ التسجيل", updated:"آخر تحديث" } : { title:"Track support request", body:"Enter the ticket number and secure identifier received when the request was created.", ticket:"Ticket number", token:"Secure identifier", search:"Check status", notFound:"No request matched these credentials.", status:"Status", priority:"Priority", category:"Category", created:"Created", updated:"Last updated" };

  let result: Ticket | null = null;
  let attempted = false;
  if (query.ticket && query.token) {
    attempted = true;
    try { result = await supabaseRpc<Ticket | null>("get_guest_support_ticket", { p_ticket_no: query.ticket, p_public_token: query.token }); } catch (error) { console.error("[support-status] lookup failed", error); }
  }

  const values = valueCopy[locale];
  const statusText = result ? values.statuses[result.status] || result.status : "";
  const priorityText = result ? values.priorities[result.priority] || result.priority : "";
  const categoryText = result ? values.categories[result.category] || result.category : "";

  return <main className="flex-1 bg-[#f5f8fb] py-10 sm:py-14"><Container className="max-w-3xl">
    <section className="rounded-[2rem] bg-[#001736] px-6 py-9 text-white shadow-[0_22px_60px_rgba(0,23,54,.15)] sm:px-9"><LifeBuoy className="h-7 w-7 text-[#82cfff]" /><h1 className="mt-4 text-2xl font-black sm:text-3xl">{copy.title}</h1><p className="mt-3 text-sm leading-7 text-[#d6e3ff]/80">{copy.body}</p></section>
    <form className="mt-6 grid gap-4 rounded-3xl border border-[#dfe4ea] bg-white p-6 shadow-[0_14px_38px_rgba(0,23,54,.045)] sm:grid-cols-[1fr_1.3fr_auto] sm:items-end">
      <label className="flex flex-col gap-1.5"><span className="text-xs font-black text-[#5f6570]">{copy.ticket}</span><input name="ticket" defaultValue={query.ticket || ""} required className="h-12 rounded-xl border border-[#c4c6d0] bg-[#f7fafd] px-3 text-sm font-bold text-[#001736] outline-none focus:border-[#009dd8]" /></label>
      <label className="flex flex-col gap-1.5"><span className="text-xs font-black text-[#5f6570]">{copy.token}</span><input name="token" defaultValue={query.token || ""} required dir="ltr" className="h-12 rounded-xl border border-[#c4c6d0] bg-[#f7fafd] px-3 font-mono text-xs text-[#001736] outline-none focus:border-[#009dd8]" /></label>
      <button className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#002b5b] px-5 text-xs font-black text-white"><Search className="h-4 w-4" />{copy.search}</button>
    </form>
    {attempted && !result ? <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">{copy.notFound}</div> : null}
    {result ? <section className="mt-5 rounded-3xl border border-[#dfe4ea] bg-white p-6 shadow-[0_14px_38px_rgba(0,23,54,.045)]"><div className="flex items-start justify-between gap-4"><div><p className="font-mono text-xs font-black text-[#ba0036]">{result.ticketNo}</p><h2 className="mt-2 text-xl font-black text-[#001736]">{result.subject}</h2></div><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700"><CheckCircle2 className="h-5 w-5" /></span></div><dl className="mt-6 grid gap-3 sm:grid-cols-2"><Row label={copy.status} value={statusText} icon={ShieldCheck}/><Row label={copy.priority} value={priorityText} icon={LifeBuoy}/><Row label={copy.category} value={categoryText} icon={Search}/><Row label={copy.created} value={new Date(result.createdAt).toLocaleString(locale)} icon={Clock3}/><Row label={copy.updated} value={new Date(result.updatedAt).toLocaleString(locale)} icon={Clock3}/></dl></section> : null}
  </Container></main>;
}

function Row({label,value,icon:Icon}:{label:string;value:string;icon:typeof Search}) { return <div className="rounded-2xl border border-[#e0e3e6] bg-[#f9fbfd] p-4"><div className="flex items-center gap-2 text-[11px] font-black text-[#747780]"><Icon className="h-3.5 w-3.5 text-[#009dd8]" />{label}</div><div className="mt-2 text-sm font-black text-[#001736]">{value}</div></div>; }
