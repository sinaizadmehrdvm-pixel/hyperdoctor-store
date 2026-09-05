import type {Metadata} from "next";
import {getLocale} from "next-intl/server";
import {Container} from "@/components/ui/container";
import {RentalTrackingPanel} from "@/components/site/rental-tracking-panel";

export const metadata:Metadata={robots:{index:false,follow:false,noarchive:true,nosnippet:true}};
function l(locale:string,fa:string,en:string,tr:string,ar:string){return locale==="fa"?fa:locale==="tr"?tr:locale==="ar"?ar:en}
export default async function Page(){const locale=await getLocale();return <main className="flex-1 bg-[#f7fafd] py-8 sm:py-12"><Container><div className="mx-auto max-w-5xl"><header className="mb-7"><p className="text-xs font-black uppercase tracking-[.16em] text-[#ba0036]">HYPER DOCTOR RENTAL</p><h1 className="mt-2 text-3xl font-black text-[#001736]">{l(locale,"رهگیری درخواست و اسناد اجاره","Rental request & document tracking","Kiralama talebi ve belge takibi","تتبع طلب ومستندات الإيجار")}</h1><p className="mt-3 max-w-3xl text-sm leading-7 text-[#747780]">{l(locale,"برای مشاهده وضعیت پرونده و اسناد صادرشده، کد پیگیری درخواست و همان شماره موبایلی که هنگام ثبت وارد کرده‌اید را وارد کنید.","Enter your rental request reference and the same phone number used when submitting the request to view status and issued documents.","Durumu ve oluşturulan belgeleri görmek için talep referansını ve başvuruda kullandığınız telefon numarasını girin.","لعرض حالة الملف والمستندات الصادرة أدخل مرجع طلب الإيجار ورقم الهاتف المستخدم عند تقديم الطلب.")}</p></header><RentalTrackingPanel/></div></Container></main>}
