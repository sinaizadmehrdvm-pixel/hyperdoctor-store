import { TextField, CheckboxField, SelectField } from "@/components/admin/form-field";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { upsertPage } from "@/app/admin/(protected)/pages/actions";

type PageFormValues={id?:string;slug?:string;titleFa?:string;titleTr?:string;titleEn?:string;titleAr?:string;contentFa?:string;contentTr?:string;contentEn?:string;contentAr?:string;template?:string;isPublished?:boolean;showInNav?:boolean;navOrder?:number};

function Editor({label,name,value,dir}:{label:string;name:string;value?:string;dir:"rtl"|"ltr"}){return <div><span className="mb-1.5 block text-xs font-medium text-muted">{label}</span><RichTextEditor name={name} defaultValue={value} dir={dir}/></div>}

export function PageForm({page}:{page?:PageFormValues}){
  return <form action={upsertPage} className="max-w-5xl space-y-6 pb-16">
    {page?.id?<input type="hidden" name="id" value={page.id}/>:null}
    <section className="rounded-2xl border border-border bg-card p-5"><h2 className="mb-4 font-black text-foreground">عنوان و مسیر</h2><div className="grid gap-4 md:grid-cols-2"><TextField label="عنوان فارسی" name="titleFa" defaultValue={page?.titleFa} required/><TextField label="Türkçe başlık" name="titleTr" defaultValue={page?.titleTr} dir="ltr"/><TextField label="English title" name="titleEn" defaultValue={page?.titleEn} dir="ltr" required/><TextField label="العنوان العربي" name="titleAr" defaultValue={page?.titleAr}/></div><div className="mt-4 grid gap-4 md:grid-cols-3"><TextField label="اسلاگ" name="slug" defaultValue={page?.slug} dir="ltr"/><SelectField label="قالب" name="template" defaultValue={page?.template??"default"} options={[{value:"default",label:"پیش‌فرض"},{value:"landing",label:"Landing"},{value:"legal",label:"حقوقی"},{value:"full-width",label:"تمام عرض"}]}/><TextField label="ترتیب منو" name="navOrder" type="number" defaultValue={page?.navOrder??0}/></div></section>
    <section className="grid gap-5 xl:grid-cols-2"><Editor label="محتوای فارسی" name="contentFa" value={page?.contentFa} dir="rtl"/><Editor label="Türkçe içerik" name="contentTr" value={page?.contentTr} dir="ltr"/><Editor label="English content" name="contentEn" value={page?.contentEn} dir="ltr"/><Editor label="المحتوى العربي" name="contentAr" value={page?.contentAr} dir="rtl"/></section>
    <section className="flex flex-wrap gap-6 rounded-2xl border border-border bg-card p-5"><CheckboxField label="منتشر شده" name="isPublished" defaultChecked={page?.isPublished}/><CheckboxField label="نمایش در منوی سایت" name="showInNav" defaultChecked={page?.showInNav}/></section>
    <div className="sticky bottom-4 z-20 flex justify-end"><button type="submit" className="min-h-12 rounded-xl bg-primary px-8 text-sm font-black text-white shadow-lg">ذخیره صفحه</button></div>
  </form>;
}
