export type AdminLocale = "fa" | "ar" | "en" | "tr";
export const adminLocales: AdminLocale[] = ["fa","ar","en","tr"];
export function getAdminLocale(value?: string | null): AdminLocale { return value === "ar" || value === "en" || value === "tr" ? value : "fa"; }
export const adminDir = (locale: AdminLocale) => locale === "fa" || locale === "ar" ? "rtl" : "ltr";
export const adminIntlLocale: Record<AdminLocale,string> = { fa:"fa-IR", ar:"ar", en:"en-US", tr:"tr-TR" };
export const adminCurrency: Record<AdminLocale,string> = { fa:"تومان", ar:"تومان", en:"Toman", tr:"Toman" };
export const adminStatus: Record<AdminLocale,Record<string,string>> = {
 fa:{PENDING_PAYMENT:"در انتظار پرداخت",PAID:"پرداخت‌شده",PROCESSING:"در حال پردازش",SHIPPED:"ارسال‌شده",COMPLETED:"تکمیل‌شده",CANCELLED:"لغوشده",FAILED:"ناموفق",OPEN:"باز",CLOSED:"بسته",PENDING:"در انتظار",ACTIVE:"فعال",INACTIVE:"غیرفعال"},
 ar:{PENDING_PAYMENT:"بانتظار الدفع",PAID:"مدفوع",PROCESSING:"قيد المعالجة",SHIPPED:"تم الشحن",COMPLETED:"مكتمل",CANCELLED:"ملغي",FAILED:"فشل",OPEN:"مفتوح",CLOSED:"مغلق",PENDING:"قيد الانتظار",ACTIVE:"نشط",INACTIVE:"غير نشط"},
 en:{PENDING_PAYMENT:"Pending payment",PAID:"Paid",PROCESSING:"Processing",SHIPPED:"Shipped",COMPLETED:"Completed",CANCELLED:"Cancelled",FAILED:"Failed",OPEN:"Open",CLOSED:"Closed",PENDING:"Pending",ACTIVE:"Active",INACTIVE:"Inactive"},
 tr:{PENDING_PAYMENT:"Ödeme bekliyor",PAID:"Ödendi",PROCESSING:"İşleniyor",SHIPPED:"Gönderildi",COMPLETED:"Tamamlandı",CANCELLED:"İptal edildi",FAILED:"Başarısız",OPEN:"Açık",CLOSED:"Kapalı",PENDING:"Bekliyor",ACTIVE:"Aktif",INACTIVE:"Pasif"}
};
export function adminNumber(value:number, locale:AdminLocale){ return new Intl.NumberFormat(adminIntlLocale[locale]).format(value); }
export function adminDate(value:string|Date, locale:AdminLocale){ return new Date(value).toLocaleDateString(adminIntlLocale[locale]); }
