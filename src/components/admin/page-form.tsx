import { TextField, CheckboxField, SelectField } from "@/components/admin/form-field";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { upsertPage } from "@/app/admin/(protected)/pages/actions";
import type { AdminLocale } from "@/lib/admin-i18n";

type PageFormValues={id?:string;slug?:string;titleFa?:string;titleTr?:string;titleEn?:string;titleAr?:string;contentFa?:string;contentTr?:string;contentEn?:string;contentAr?:string;template?:string;isPublished?:boolean;showInNav?:boolean;navOrder?:number};
const c:Record<AdminLocale,Record<string,string>>={
  fa:{heading:"عنوان و مسیر",faTitle:"عنوان فارسی",trTitle:"عنوان ترکی",enTitle:"عنوان انگلیسی",arTitle:"عنوان عربی",slug:"اسلاگ",template:"قالب",default:"پیش‌فرض",landing:"لندینگ",legal:"حقوقی",full:"تمام عرض",navOrder:"ترتیب منو",faContent:"محتوای فارسی",trContent:"محتوای ترکی",enContent:"محتوای انگلیسی",arContent:"محتوای عربی",published:"منتشر شده",showNav:"نمایش در منوی سایت",save:"ذخیره صفحه"},
  ar:{heading:"العنوان والمسار",faTitle:"العنوان الفارسي",trTitle:"العنوان التركي",enTitle:"العنوان الإنجليزي",arTitle:"العنوان العربي",slug:"المسار المختصر",template:"القالب",default:"افتراضي",landing:"صفحة هبوط",legal:"قانوني",full:"عرض كامل",navOrder:"ترتيب القائمة",faContent:"المحتوى الفارسي",trContent:"المحتوى التركي",enContent:"المحتوى الإنجليزي",arContent:"المحتوى العربي",published:"منشورة",showNav:"إظهار في قائمة الموقع",save:"حفظ الصفحة"},
  en:{heading:"Title & path",faTitle:"Persian title",trTitle:"Turkish title",enTitle:"English title",arTitle:"Arabic title",slug:"Slug",template:"Template",default:"Default",landing:"Landing",legal:"Legal",full:"Full width",navOrder:"Navigation order",faContent:"Persian content",trContent:"Turkish content",enContent:"English content",arContent:"Arabic content",published:"Published",showNav:"Show in site navigation",save:"Save page"},
  tr:{heading:"Başlık ve yol",faTitle:"Farsça başlık",trTitle:"Türkçe başlık",enTitle:"İngilizce başlık",arTitle:"Arapça başlık",slug:"Slug",template:"Şablon",default:"Varsayılan",landing:"Açılış sayfası",legal:"Yasal",full:"Tam genişlik",navOrder:"Menü sırası",faContent:"Farsça içerik",trContent:"Türkçe içerik",enContent:"İngilizce içerik",arContent:"Arapça içerik",published:"Yayında",showNav:"Site menüsünde göster",save:"Sayfayı kaydet"}
};
function Editor({label,name,value,dir}:{label:string;name:string;value?:string;dir:"rtl"|"ltr"}){return <div><span className="mb-1.5 block text-xs font-medium text-muted">{label}</span><RichTextEditor name={name} defaultValue={value} dir={dir}/></div>}

export function PageForm({page,locale="fa"}:{page?:PageFormValues;locale?:AdminLocale}){
  const t=c[locale];
  return <form action={upsertPage} className="max-w-5xl space-y-6 pb-16">
    {page?.id?<input type="hidden" name="id" value={page.id}/>:null}
    <section className="rounded-2xl border border-border bg-card p-5"><h2 className="mb-4 font-black text-foreground">{t.heading}</h2><div className="grid gap-4 md:grid-cols-2"><TextField label={t.faTitle} name="titleFa" defaultValue={page?.titleFa} required/><TextField label={t.trTitle} name="titleTr" defaultValue={page?.titleTr} dir="ltr"/><TextField label={t.enTitle} name="titleEn" defaultValue={page?.titleEn} dir="ltr" required/><TextField label={t.arTitle} name="titleAr" defaultValue={page?.titleAr}/></div><div className="mt-4 grid gap-4 md:grid-cols-3"><TextField label={t.slug} name="slug" defaultValue={page?.slug} dir="ltr"/><SelectField label={t.template} name="template" defaultValue={page?.template??"default"} options={[{value:"default",label:t.default},{value:"landing",label:t.landing},{value:"legal",label:t.legal},{value:"full-width",label:t.full}]}/><TextField label={t.navOrder} name="navOrder" type="number" defaultValue={page?.navOrder??0}/></div></section>
    <section className="grid gap-5 xl:grid-cols-2"><Editor label={t.faContent} name="contentFa" value={page?.contentFa} dir="rtl"/><Editor label={t.trContent} name="contentTr" value={page?.contentTr} dir="ltr"/><Editor label={t.enContent} name="contentEn" value={page?.contentEn} dir="ltr"/><Editor label={t.arContent} name="contentAr" value={page?.contentAr} dir="rtl"/></section>
    <section className="flex flex-wrap gap-6 rounded-2xl border border-border bg-card p-5"><CheckboxField label={t.published} name="isPublished" defaultChecked={page?.isPublished}/><CheckboxField label={t.showNav} name="showInNav" defaultChecked={page?.showInNav}/></section>
    <div className="sticky bottom-4 z-20 flex justify-end"><button type="submit" className="min-h-12 rounded-xl bg-primary px-8 text-sm font-black text-white shadow-lg">{t.save}</button></div>
  </form>;
}
