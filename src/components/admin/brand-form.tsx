import { TextField, TextAreaField } from "@/components/admin/form-field";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import { upsertBrand } from "@/app/admin/(protected)/brands/actions";
type BrandValues={id?:string;slug?:string;nameFa?:string;nameEn?:string;logoUrl?:string|null;websiteUrl?:string;descriptionFa?:string;descriptionEn?:string;order?:number};
export function BrandForm({brand}:{brand?:BrandValues}){return <form action={upsertBrand} className="max-w-2xl space-y-5">
{brand?.id?<input type="hidden" name="id" value={brand.id}/>:null}
<div className="grid gap-4 sm:grid-cols-2"><TextField label="نام برند (فارسی)" name="nameFa" defaultValue={brand?.nameFa} required/><TextField label="نام برند (English)" name="nameEn" defaultValue={brand?.nameEn} dir="ltr" required/></div>
<div className="grid gap-4 sm:grid-cols-2"><TextField label="اسلاگ برند" name="slug" defaultValue={brand?.slug} dir="ltr"/><TextField label="وب‌سایت برند" name="websiteUrl" defaultValue={brand?.websiteUrl} dir="ltr"/></div>
<div className="grid gap-4 sm:grid-cols-2"><TextAreaField label="توضیحات برند (فارسی)" name="descriptionFa" defaultValue={brand?.descriptionFa}/><TextAreaField label="توضیحات برند (English)" name="descriptionEn" defaultValue={brand?.descriptionEn} dir="ltr"/></div>
<ImageUploadField label="لوگوی برند" name="logoUrl" defaultValue={brand?.logoUrl}/><TextField label="ترتیب نمایش" name="order" type="number" defaultValue={brand?.order??0}/>
<button type="submit" className="min-h-11 rounded-lg bg-primary px-6 text-sm font-medium text-white">ذخیره</button></form>}