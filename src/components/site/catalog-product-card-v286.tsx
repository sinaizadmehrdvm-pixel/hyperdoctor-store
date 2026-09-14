import Image from "next/image";
import { ImageOff, ShieldCheck } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { localizedAlt, localizedName } from "@/lib/i18n-content";

function l(locale:string,fa:string,en:string,tr:string,ar:string){if(locale==="en")return en;if(locale==="tr")return tr;if(locale==="ar")return ar;return fa}

export function CatalogProductCardV286({product,locale}:{product:any;locale:string}){
  const name=localizedName(locale,product),image=product.images?.[0],brand=product.brandEntity?.name||product.brand||"",priceKnown=product.commerceReady===true&&Number(product.price)>0;
  return <article className="group flex min-h-full flex-col overflow-hidden rounded-[1.25rem] border border-[#e0e3e6] bg-white p-3 shadow-[0_8px_26px_rgba(0,23,54,.06)] transition hover:-translate-y-1 hover:shadow-[0_18px_42px_rgba(0,23,54,.12)]">
    <Link href={`/catalog/${product.slug}`} className="vitalis-focus relative aspect-[1.08/1] overflow-hidden rounded-[1rem] bg-gradient-to-b from-[#f8fafc] to-[#edf2f6]">
      {image?<Image src={image.url} alt={localizedAlt(locale,image,name)} fill className="object-contain p-3 transition-transform duration-300 group-hover:scale-[1.035]" sizes="(min-width:1280px) 260px, (min-width:768px) 32vw, 48vw"/>:<div className="flex h-full flex-col items-center justify-center gap-2 text-[#9aa0aa]"><ImageOff className="h-8 w-8"/><span className="text-[10px] font-bold">{l(locale,"تصویر ثبت نشده","No image","Görsel yok","لا توجد صورة")}</span></div>}
      <span className="absolute start-2.5 top-2.5 inline-flex items-center gap-1 rounded-full border border-white/70 bg-white/92 px-2.5 py-1 text-[10px] font-black text-[#187143] shadow-sm backdrop-blur"><ShieldCheck className="h-3.5 w-3.5"/>{l(locale,"تصویر تأییدشده","Verified media","Doğrulanmış görsel","وسائط موثقة")}</span>
    </Link>
    <div className="flex flex-1 flex-col px-1 pb-1 pt-3">{brand?<p className="mb-1 truncate text-[10px] font-black uppercase tracking-[.08em] text-[#747780]">{brand}</p>:null}<Link href={`/catalog/${product.slug}`} className="vitalis-focus line-clamp-2 min-h-12 rounded-md text-sm font-black leading-6 text-[#181c1e] hover:text-[#002b5b]">{name}</Link>{product.modelNumber?<p className="mt-1 text-[10px] text-[#747780]">{l(locale,"مدل","Model","Model","الموديل")}: <span className="font-bold text-[#43474f]">{product.modelNumber}</span></p>:null}<div className="mt-3 rounded-xl bg-[#f7fafd] px-3 py-2.5">{priceKnown?<strong className="text-sm font-black text-[#001736]">{new Intl.NumberFormat(locale).format(Number(product.price))}</strong>:<><strong className="block text-xs font-black text-[#001736]">{l(locale,"قیمت فروش هنوز ثبت نشده","Sales price not set yet","Satış fiyatı henüz girilmedi","لم يتم إدخال سعر البيع بعد")}</strong><span className="mt-1 block text-[10px] leading-5 text-[#747780]">{l(locale,"اطلاعات فروش فقط پس از تأیید اپراتور نمایش داده می‌شود.","Sales data appears only after operator approval.","Satış bilgileri yalnızca operatör onayından sonra gösterilir.","تظهر بيانات البيع فقط بعد موافقة المشغل.")}</span></>}</div><Link href={`/catalog/${product.slug}`} className="vitalis-focus mt-auto pt-3 text-xs font-black text-[#002b5b]">{l(locale,"مشاهده مشخصات","View details","Detayları gör","عرض التفاصيل")}</Link></div>
  </article>
}
