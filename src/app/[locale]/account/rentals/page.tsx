import Link from "next/link";
import {CalendarRange,FileCheck2,MapPin,PackageCheck,Search,ShieldCheck} from "lucide-react";
import {customerRpc,requireCustomerSession} from "@/lib/customer-auth";

type Rental={
 rentalRequestId:string;requestStatus:string;createdAt:string;requestedQuantity:number;
 preferredStartDate?:string|null;preferredEndDate?:string|null;approvedQuantity?:number|null;
 approvedStartDate?:string|null;approvedEndDate?:string|null;quotedAmount?:number|null;quotedDeposit?:number|null;
 lifecycleState?:string|null;contractNumber?:string|null;handoverAt?:string|null;returnedAt?:string|null;settledAt?:string|null;
 hasContract:boolean;hasSettlement:boolean;
 product:{id:string;sku:string;modelNumber?:string|null;nameFa:string;nameTr?:string|null;nameEn:string;nameAr?:string|null;brandName?:string|null};
 branch?:{id:string;code:string;nameFa:string;nameTr?:string|null;nameEn:string;nameAr?:string|null;countryCode:string;currency:string}|null;
};

const pick=(locale:string,fa:string,en:string,tr:string,ar:string)=>locale==="fa"?fa:locale==="tr"?tr:locale==="ar"?ar:en;
const localized=(locale:string,o:any,key:string)=>o?.[`${key}${locale[0].toUpperCase()+locale.slice(1)}`]||o?.[`${key}En`]||o?.[`${key}Fa`]||"—";
const number=(locale:string,n:number|null|undefined)=>n==null?"—":new Intl.NumberFormat(locale==="fa"?"fa-IR":locale==="tr"?"tr-TR":locale==="ar"?"ar":"en-US").format(n);
const stateText=(locale:string,state?:string|null)=>{const s=String(state||"").toUpperCase();const m:Record<string,[string,string,string,string]>={NEW:["جدید","New","Yeni","جديد"],APPROVED:["تأیید شده","Approved","Onaylandı","تمت الموافقة"],REJECTED:["رد شده","Rejected","Reddedildi","مرفوض"],CANCELLED:["لغو شده","Cancelled","İptal edildi","ملغي"],ACTIVE:["فعال / تحویل شده","Active / handed over","Aktif / teslim edildi","نشط / تم التسليم"],RETURNED:["برگشت داده شده","Returned","İade edildi","تم الإرجاع"],SETTLED:["تسویه شده","Settled","Uzlaşıldı","تمت التسوية"]};const v=m[s];return v?pick(locale,v[0],v[1],v[2],v[3]):state||"—"};

export default async function CustomerRentalsPage({params}:{params:Promise<{locale:string}>}){
 const {locale}=await params;
 await requireCustomerSession(locale);
 const rentals=await customerRpc<Rental[]>("customer_rentals");
 const rtl=locale==="fa"||locale==="ar";
 return <main className="min-h-screen bg-[#f5f8fb] py-8 sm:py-12" dir={rtl?"rtl":"ltr"}>
  <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
   <div className="flex flex-wrap items-start justify-between gap-4">
    <div><p className="text-xs font-black uppercase tracking-[.16em] text-[#ba0036]">HYPER DOCTOR RENTAL</p><h1 className="mt-2 text-3xl font-black text-[#001736]">{pick(locale,"اجاره‌های من","My rentals","Kiralamalarım","إيجاراتي")}</h1><p className="mt-2 max-w-2xl text-sm leading-7 text-[#69717d]">{pick(locale,"تمام درخواست‌های اجاره‌ای که با موبایل یا ایمیل حساب شما تطبیق دارند، بدون وارد کردن دوباره کد پیگیری نمایش داده می‌شوند.","Rental requests matching your verified account phone or email are shown here without re-entering a tracking reference.","Doğrulanmış hesap telefonunuz veya e-postanızla eşleşen kiralama talepleri, takip kodunu yeniden girmeden burada gösterilir.","تظهر هنا طلبات الإيجار المطابقة لهاتف حسابك أو بريدك الإلكتروني الموثق دون إعادة إدخال رمز التتبع.")}</p></div>
    <div className="flex flex-wrap gap-2"><Link href={`/${locale}/account`} className="inline-flex min-h-11 items-center rounded-xl border border-[#cfd6dd] bg-white px-4 text-xs font-black text-[#001736]">{pick(locale,"حساب من","My account","Hesabım","حسابي")}</Link><Link href={`/${locale}/rental`} className="inline-flex min-h-11 items-center rounded-xl bg-[#001736] px-4 text-xs font-black text-white">{pick(locale,"درخواست اجاره جدید","New rental request","Yeni kiralama talebi","طلب إيجار جديد")}</Link></div>
   </div>
   <div className="mt-7 grid gap-3 sm:grid-cols-3">
    <Summary icon={PackageCheck} value={number(locale,rentals.length)} label={pick(locale,"کل درخواست‌ها","All requests","Tüm talepler","كل الطلبات")}/>
    <Summary icon={ShieldCheck} value={number(locale,rentals.filter(r=>["APPROVED","ACTIVE"].includes(String(r.lifecycleState||r.requestStatus).toUpperCase())).length)} label={pick(locale,"تأیید/فعال","Approved / active","Onaylı / aktif","موافق عليه / نشط")}/>
    <Summary icon={FileCheck2} value={number(locale,rentals.filter(r=>r.hasContract||r.hasSettlement).length)} label={pick(locale,"دارای سند","With documents","Belgeli","مع مستندات")}/>
   </div>
   <section className="mt-6 space-y-4">
    {rentals.map(r=>{const currency=r.branch?.currency||"";const start=r.approvedStartDate||r.preferredStartDate;const end=r.approvedEndDate||r.preferredEndDate;const state=r.lifecycleState||r.requestStatus;return <article key={r.rentalRequestId} className="rounded-[1.75rem] border border-white bg-white p-5 shadow-[0_14px_38px_rgba(0,23,54,.05)] sm:p-6">
     <div className="flex flex-wrap items-start justify-between gap-4"><div><div className="text-lg font-black text-[#001736]">{localized(locale,r.product,"name")}</div><div className="mt-1 text-xs text-[#747b85]">{r.product.brandName||"—"} · <span dir="ltr">{r.product.sku}</span></div><div className="mt-2 font-mono text-[11px] font-bold text-[#59616c]" dir="ltr">{r.rentalRequestId}</div></div><span className="rounded-full bg-[#eaf5f9] px-4 py-2 text-xs font-black text-[#00365f]">{stateText(locale,state)}</span></div>
     <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Item icon={CalendarRange} label={pick(locale,"دوره","Period","Dönem","الفترة")} value={`${start||"—"} → ${end||"—"}`}/>
      <Item icon={PackageCheck} label={pick(locale,"تعداد","Quantity","Adet","الكمية")} value={number(locale,r.approvedQuantity??r.requestedQuantity)}/>
      <Item icon={MapPin} label={pick(locale,"شعبه","Branch","Şube","الفرع")} value={r.branch?`${localized(locale,r.branch,"name")} · ${r.branch.code}`:"—"}/>
      <Item icon={ShieldCheck} label={pick(locale,"مبلغ / ودیعه","Charge / deposit","Ücret / depozito","القيمة / الوديعة")} value={`${number(locale,r.quotedAmount)} ${currency} / ${number(locale,r.quotedDeposit)} ${currency}`}/>
     </div>
     <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-[#edf0f3] pt-4"><DocumentBadge ok={r.hasContract} text={pick(locale,"قرارداد","Contract","Sözleşme","العقد")}/><DocumentBadge ok={r.hasSettlement} text={pick(locale,"گزارش تسویه","Settlement report","Uzlaşma raporu","تقرير التسوية")}/><span className="flex-1"/><Link href={`/${locale}/account/rentals/${encodeURIComponent(r.rentalRequestId)}`} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#b9dff0] px-3 text-xs font-black text-[#002b5b]"><Search className="h-4 w-4"/>{pick(locale,"جزئیات امن","Secure details","Güvenli ayrıntılar","التفاصيل الآمنة")}</Link></div>
    </article>})}
    {!rentals.length?<div className="rounded-[1.75rem] border border-dashed border-[#cfd6dd] bg-white p-10 text-center"><PackageCheck className="mx-auto h-10 w-10 text-[#9aa3ad]"/><h2 className="mt-4 text-lg font-black text-[#001736]">{pick(locale,"هنوز اجاره‌ای برای این حساب پیدا نشد.","No rentals found for this account yet.","Bu hesap için henüz kiralama bulunamadı.","لم يتم العثور على إيجارات لهذا الحساب بعد.")}</h2><p className="mt-2 text-sm text-[#747b85]">{pick(locale,"اگر قبلاً درخواست داده‌اید، مطمئن شوید موبایل یا ایمیل حساب با اطلاعات درخواست یکسان است.","If you already submitted a request, make sure your account phone or email matches the request details.","Daha önce talep verdiyseniz hesap telefonu veya e-postasının talep bilgileriyle eşleştiğinden emin olun.","إذا سبق أن قدمت طلباً، فتأكد من تطابق هاتف الحساب أو البريد الإلكتروني مع بيانات الطلب.")}</p></div>:null}
   </section>
  </div>
 </main>;
}
function Summary({icon:Icon,value,label}:{icon:any;value:string;label:string}){return <div className="rounded-2xl border border-white bg-white p-5 shadow-[0_10px_30px_rgba(0,23,54,.04)]"><Icon className="h-5 w-5 text-[#ba0036]"/><div className="mt-3 text-3xl font-black text-[#001736]">{value}</div><div className="mt-1 text-xs font-bold text-[#69717d]">{label}</div></div>}
function Item({icon:Icon,label,value}:{icon:any;label:string;value:string}){return <div className="rounded-xl border border-[#e0e5ea] bg-[#fafcfe] p-3"><div className="flex items-center gap-2 text-[10px] font-black text-[#818892]"><Icon className="h-3.5 w-3.5"/>{label}</div><div className="mt-2 break-words text-xs font-bold text-[#303640]">{value}</div></div>}
function DocumentBadge({ok,text}:{ok:boolean;text:string}){return <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-black ${ok?"bg-emerald-50 text-emerald-800":"bg-[#f2f4f6] text-[#818892]"}`}><FileCheck2 className="h-3.5 w-3.5"/>{text}: {ok?"✓":"—"}</span>}
