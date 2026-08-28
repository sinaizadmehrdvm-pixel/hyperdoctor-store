import { getLocale } from "next-intl/server";
import { BadgeCheck, CalendarDays, Search, ShieldCheck } from "lucide-react";
import { Container } from "@/components/ui/container";
import { supabaseRpc } from "@/lib/supabase-rest";

type WarrantyResult = {
  serialNumber:string;
  status:string;
  startsAt:string;
  expiresAt:string;
  orderNumber:string;
  productId:string;
  productNameFa:string;
  productNameTr:string;
  productNameEn:string;
  productNameAr:string;
};

const statusCopy:Record<string,[string,string,string,string]> = {
  ACTIVE:["فعال","Active","Aktif","نشط"],
  EXPIRED:["منقضی شده","Expired","Süresi doldu","منتهي"],
  PENDING:["در انتظار فعال‌سازی","Pending activation","Etkinleştirme bekliyor","بانتظار التفعيل"],
  CANCELLED:["لغو شده","Cancelled","İptal edildi","ملغي"],
  VOID:["باطل شده","Void","Geçersiz","باطل"],
  SUSPENDED:["تعلیق شده","Suspended","Askıya alındı","معلّق"],
};

function localizedStatus(locale:string,status:string){
  const value=statusCopy[status?.toUpperCase()];
  if(!value)return status;
  return locale==="fa"?value[0]:locale==="tr"?value[2]:locale==="ar"?value[3]:value[1];
}

export default async function WarrantyStatusPage({ searchParams }: { searchParams: Promise<{ serial?:string; token?:string }> }) {
  const [locale, query] = await Promise.all([getLocale(), searchParams]);
  const copy = locale === "fa" ? { title:"استعلام وضعیت گارانتی", body:"شماره سریال و شناسه امن دریافت‌شده هنگام ثبت گارانتی را وارد کنید.", serial:"شماره سریال", token:"شناسه امن", search:"بررسی گارانتی", notFound:"گارانتی معتبری با این اطلاعات پیدا نشد.", lookupError:"در حال حاضر امکان بررسی گارانتی وجود ندارد. لطفاً کمی بعد دوباره تلاش کنید.", product:"محصول", status:"وضعیت", start:"شروع پوشش", end:"پایان پوشش", order:"شماره سفارش" } : locale === "tr" ? { title:"Garanti durumunu sorgula", body:"Garanti kaydında aldığınız seri numarası ve güvenli kimliği girin.", serial:"Seri numarası", token:"Güvenli kimlik", search:"Garantiyi kontrol et", notFound:"Bu bilgilerle eşleşen garanti kaydı bulunamadı.", lookupError:"Garanti sorgulaması şu anda kullanılamıyor. Lütfen kısa süre sonra tekrar deneyin.", product:"Ürün", status:"Durum", start:"Başlangıç", end:"Bitiş", order:"Sipariş no" } : locale === "ar" ? { title:"التحقق من حالة الضمان", body:"أدخل الرقم التسلسلي والمعرف الآمن اللذين حصلت عليهما عند تسجيل الضمان.", serial:"الرقم التسلسلي", token:"المعرف الآمن", search:"فحص الضمان", notFound:"لم يتم العثور على ضمان بهذه المعلومات.", lookupError:"خدمة التحقق من الضمان غير متاحة حالياً. يرجى المحاولة مرة أخرى بعد قليل.", product:"المنتج", status:"الحالة", start:"بداية التغطية", end:"نهاية التغطية", order:"رقم الطلب" } : { title:"Check warranty status", body:"Enter the serial number and secure identifier received during warranty registration.", serial:"Serial number", token:"Secure identifier", search:"Check warranty", notFound:"No warranty matched these credentials.", lookupError:"Warranty lookup is temporarily unavailable. Please try again shortly.", product:"Product", status:"Status", start:"Coverage starts", end:"Coverage ends", order:"Order number" };

  let result:WarrantyResult|null=null; let attempted=false; let lookupFailed=false;
  if(query.serial&&query.token){attempted=true;try{result=await supabaseRpc<WarrantyResult|null>("get_guest_warranty",{p_serial_number:query.serial,p_public_token:query.token});}catch(error){lookupFailed=true;console.error("[warranty-status] lookup failed",error);}}
  const productName = result ? locale === "fa" ? result.productNameFa : locale === "tr" ? result.productNameTr || result.productNameEn : locale === "ar" ? result.productNameAr || result.productNameEn : result.productNameEn : "";

  return <main className="flex-1 bg-[#f5f8fb] py-10 sm:py-14"><Container className="max-w-3xl">
    <section className="rounded-[2rem] bg-[#001736] px-6 py-9 text-white shadow-[0_22px_60px_rgba(0,23,54,.15)] sm:px-9"><BadgeCheck className="h-7 w-7 text-[#82cfff]"/><h1 className="mt-4 text-2xl font-black sm:text-3xl">{copy.title}</h1><p className="mt-3 text-sm leading-7 text-[#d6e3ff]/80">{copy.body}</p></section>
    <form className="mt-6 grid gap-4 rounded-3xl border border-[#dfe4ea] bg-white p-6 shadow-[0_14px_38px_rgba(0,23,54,.045)] sm:grid-cols-[1fr_1.35fr_auto] sm:items-end"><label className="flex flex-col gap-1.5"><span className="text-xs font-black text-[#5f6570]">{copy.serial}</span><input name="serial" required defaultValue={query.serial||""} dir="ltr" autoComplete="off" className="h-12 rounded-xl border border-[#c4c6d0] bg-[#f7fafd] px-3 text-sm font-bold text-[#001736] outline-none focus:border-[#009dd8]"/></label><label className="flex flex-col gap-1.5"><span className="text-xs font-black text-[#5f6570]">{copy.token}</span><input name="token" required defaultValue={query.token||""} dir="ltr" autoComplete="off" className="h-12 rounded-xl border border-[#c4c6d0] bg-[#f7fafd] px-3 font-mono text-xs text-[#001736] outline-none focus:border-[#009dd8]"/></label><button className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#002b5b] px-5 text-xs font-black text-white"><Search className="h-4 w-4"/>{copy.search}</button></form>
    {attempted&&lookupFailed?<div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-800">{copy.lookupError}</div>:null}
    {attempted&&!lookupFailed&&!result?<div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">{copy.notFound}</div>:null}
    {result?<section className="mt-5 rounded-3xl border border-[#dfe4ea] bg-white p-6 shadow-[0_14px_38px_rgba(0,23,54,.045)]"><div className="flex items-start justify-between gap-4"><div><p className="font-mono text-xs font-black text-[#ba0036]" dir="ltr">{result.serialNumber}</p><h2 className="mt-2 text-xl font-black text-[#001736]">{productName}</h2></div><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700"><ShieldCheck className="h-6 w-6"/></span></div><dl className="mt-6 grid gap-3 sm:grid-cols-2"><Row label={copy.status} value={localizedStatus(locale,result.status)}/><Row label={copy.start} value={new Date(result.startsAt).toLocaleDateString(locale)}/><Row label={copy.end} value={new Date(result.expiresAt).toLocaleDateString(locale)}/>{result.orderNumber?<Row label={copy.order} value={result.orderNumber} ltr/>:null}</dl></section>:null}
  </Container></main>;
}

function Row({label,value,ltr}:{label:string;value:string;ltr?:boolean}){return <div className="rounded-2xl border border-[#e0e3e6] bg-[#f9fbfd] p-4"><div className="flex items-center gap-2 text-[11px] font-black text-[#747780]"><CalendarDays className="h-3.5 w-3.5 text-[#009dd8]"/>{label}</div><div className="mt-2 text-sm font-black text-[#001736]" dir={ltr?"ltr":undefined}>{value}</div></div>}
