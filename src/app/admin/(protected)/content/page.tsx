import Link from "next/link";
import { FileText, ImageIcon, Newspaper, Package, PanelsTopLeft } from "lucide-react";

const modules=[
  {href:"/admin/products",title:"مدیریت محصولات",body:"کاتالوگ، قیمت، موجودی، وضعیت انتشار و ویرایش محصول",icon:Package,tone:"bg-[#001736] text-white"},
  {href:"/admin/articles",title:"مقالات و مجله علمی",body:"ایجاد و ویرایش محتوای علمی چهارزبانه",icon:Newspaper,tone:"bg-[#edf4ff] text-[#002b5b]"},
  {href:"/admin/banners",title:"بنرها و جشنواره",body:"مدیریت اسلایدها، تصاویر کمپین و زمان‌بندی انتشار",icon:PanelsTopLeft,tone:"bg-[#fff0f3] text-[#e80346]"},
  {href:"/admin/pages",title:"صفحات سایت",body:"مدیریت صفحات محتوایی و وضعیت انتشار",icon:FileText,tone:"bg-emerald-50 text-emerald-700"},
  {href:"/admin/media",title:"رسانه‌ها",body:"مدیریت فایل‌های تصویری و رسانه‌ای",icon:ImageIcon,tone:"bg-amber-50 text-amber-700"},
];

export default function AdminContentHubPage(){
  return <div className="mx-auto max-w-[1450px]">
    <div><p className="text-xs font-black uppercase tracking-[.18em] text-[#e80346]">Content Operations</p><h1 className="mt-2 text-3xl font-black text-[#001736]">مدیریت محتوا و محصولات</h1><p className="mt-2 text-sm text-[#747780]">مرکز دسترسی سریع به کاتالوگ، محتوا، بنرها و رسانه‌های سایت</p></div>
    <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{modules.map(({href,title,body,icon:Icon,tone})=><Link key={href} href={href} className="group rounded-[1.6rem] border border-[#e2e6eb] bg-white p-6 shadow-[0_12px_30px_rgba(0,23,54,.04)] transition hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(0,23,54,.08)]"><span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${tone}`}><Icon className="h-5 w-5"/></span><h2 className="mt-5 text-lg font-black text-[#001736]">{title}</h2><p className="mt-2 text-sm leading-7 text-[#747780]">{body}</p><span className="mt-5 inline-flex text-xs font-black text-[#e80346]">ورود به بخش ←</span></Link>)}</div>
  </div>;
}
