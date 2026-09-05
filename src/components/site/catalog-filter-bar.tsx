"use client";

import {usePathname,useRouter,useSearchParams} from "next/navigation";
import {Link} from "@/i18n/navigation";
import {CalendarRange,Filter,GalleryVerticalEnd,X} from "lucide-react";

type Brand={id:string;name:string;count:number};
type Term={id:string;dimension:string;nameFa:string;nameTr:string;nameEn:string;nameAr:string;count:number};
type FacetChoice={value:string;count:number};
type AttributeFacet={id:string;code:string;nameFa:string;nameTr:string;nameEn:string;nameAr:string;dataType:string;unit?:string|null;choices:FacetChoice[]};
type UseFacet={value:"rental"|"professional"|"home";count:number};

const names:Record<string,Record<string,string>>={
  REGULATORY_CLASSIFICATION:{fa:"کلاس قانونی",en:"Regulatory",tr:"Regülasyon",ar:"التصنيف التنظيمي"},
  MEDICAL_SPECIALTY:{fa:"تخصص پزشکی",en:"Specialty",tr:"Uzmanlık",ar:"التخصص الطبي"},
  CLINICAL_APPLICATION:{fa:"کاربرد بالینی",en:"Clinical use",tr:"Klinik kullanım",ar:"الاستخدام السريري"},
  INTENDED_USE:{fa:"کاربری",en:"Intended use",tr:"Kullanım amacı",ar:"الاستخدام المقصود"},
  CARE_SETTING:{fa:"محیط مراقبت",en:"Care setting",tr:"Bakım ortamı",ar:"بيئة الرعاية"},
  PRODUCT_TYPE:{fa:"نوع محصول",en:"Product type",tr:"Ürün tipi",ar:"نوع المنتج"},
  PRODUCT_TECHNOLOGY:{fa:"فناوری",en:"Technology",tr:"Teknoloji",ar:"التقنية"},
  COLLECTION:{fa:"کالکشن",en:"Collection",tr:"Koleksiyon",ar:"المجموعة"},
  COMPATIBILITY:{fa:"سازگاری",en:"Compatibility",tr:"Uyumluluk",ar:"التوافق"},
};

function label(t:{nameFa:string;nameTr:string;nameEn:string;nameAr:string},locale:string){return(locale==="fa"?t.nameFa:locale==="tr"?t.nameTr:locale==="ar"?t.nameAr:t.nameEn)||t.nameEn||t.nameFa}
function text(locale:string,fa:string,en:string,tr:string,ar:string){return locale==="fa"?fa:locale==="tr"?tr:locale==="ar"?ar:en}
function choiceLabel(a:AttributeFacet,value:string,locale:string){if(a.dataType==="BOOLEAN")return value==="true"?text(locale,"بله","Yes","Evet","نعم"):text(locale,"خیر","No","Hayır","لا");return a.unit?`${value} ${a.unit}`:value}
function countLabel(value:number,locale:string){return new Intl.NumberFormat(locale).format(Math.max(0,value||0))}

export function CatalogFilterBar({locale,brands,terms,attributes,useProfiles,resultCount}:{locale:string;brands:Brand[];terms:Term[];attributes:AttributeFacet[];useProfiles:UseFacet[];resultCount:number}){
  const router=useRouter(),pathname=usePathname(),searchParams=useSearchParams();
  const brandId=searchParams.get("brand")||"",termIds=(searchParams.get("taxonomy")||"").split(",").filter(Boolean).slice(0,12),use=searchParams.get("use")||"",attrTokens=searchParams.getAll("attribute").slice(0,12);
  const selected=new Set(termIds),selectedAttrs=new Map<string,string>();
  for(const token of attrTokens){const i=token.indexOf("~");if(i>0)selectedAttrs.set(token.slice(0,i),token.slice(i+1))}
  const groups=[...new Set(terms.map(t=>t.dimension))],termById=new Map(terms.map(term=>[term.id,term])),useCounts=new Map(useProfiles.map(item=>[item.value,item.count]));
  const replace=(mutate:(params:URLSearchParams)=>void)=>{const params=new URLSearchParams(searchParams.toString());mutate(params);const query=params.toString();router.replace(query?`${pathname}?${query}`:pathname,{scroll:false})};
  const setParam=(name:string,value:string)=>replace(params=>{if(value)params.set(name,value);else params.delete(name)});
  const toggle=(term:Term)=>{const next=new Set(selected);if(next.has(term.id)){next.delete(term.id)}else{for(const id of [...next]){if(termById.get(id)?.dimension===term.dimension)next.delete(id)}next.add(term.id)}setParam("taxonomy",[...next].slice(0,12).join(","))};
  const setAttribute=(id:string,value:string)=>replace(params=>{const next=new Map(selectedAttrs);value?next.set(id,value):next.delete(id);params.delete("attribute");for(const[definitionId,v]of[...next.entries()].slice(0,12))params.append("attribute",`${definitionId}~${v}`)});
  const clear=()=>replace(params=>{params.delete("brand");params.delete("taxonomy");params.delete("use");params.delete("attribute")});
  const active=Boolean(brandId||termIds.length||use||selectedAttrs.size),resultsText=text(locale,"نتیجه","results","sonuç","نتيجة");
  return <aside className="border-b border-[#e0e3e6] bg-white"><div className="mx-auto max-w-7xl px-4 py-3 sm:px-6"><div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
    <span className="inline-flex shrink-0 items-center gap-1.5 text-xs font-black text-[#001736]"><Filter className="h-4 w-4"/>{text(locale,"فیلتر حرفه‌ای","Advanced filters","Gelişmiş filtre","تصفية متقدمة")}</span>
    <span aria-live="polite" className="shrink-0 rounded-full bg-[#eef3f9] px-3 py-2 text-[11px] font-black text-[#001736]">{countLabel(resultCount,locale)} {resultsText}</span>
    {brands.length?<select aria-label={text(locale,"برند","Brand","Marka","العلامة التجارية")} value={brandId} onChange={e=>setParam("brand",e.target.value)} className="h-9 shrink-0 rounded-full border bg-white px-3 text-xs font-bold"><option value="">{text(locale,"همه برندها","All brands","Tüm markalar","كل العلامات")}</option>{brands.map(b=><option key={b.id} value={b.id}>{b.name} ({countLabel(b.count,locale)})</option>)}</select>:null}
    <select aria-label={text(locale,"نوع کاربری","Use profile","Kullanım türü","نوع الاستخدام")} value={use} onChange={e=>setParam("use",e.target.value)} className="h-9 shrink-0 rounded-full border bg-white px-3 text-xs font-bold"><option value="">{text(locale,"همه کاربری‌ها","All use profiles","Tüm kullanım türleri","كل الاستخدامات")}</option><option value="rental">{text(locale,"قابل اجاره","Rental eligible","Kiralanabilir","قابل للإيجار")} ({countLabel(useCounts.get("rental")??0,locale)})</option><option value="professional">{text(locale,"حرفه‌ای / کلینیکی","Professional / clinical","Profesyonel / klinik","مهني / سريري")} ({countLabel(useCounts.get("professional")??0,locale)})</option><option value="home">{text(locale,"خانگی","Home use","Ev kullanımı","استخدام منزلي")} ({countLabel(useCounts.get("home")??0,locale)})</option></select>
    {attributes.map(a=><select key={a.id} aria-label={label(a,locale)} value={selectedAttrs.get(a.id)||""} onChange={e=>setAttribute(a.id,e.target.value)} className="h-9 max-w-64 shrink-0 rounded-full border bg-white px-3 text-xs font-bold"><option value="">{label(a,locale)}</option>{a.choices.map(choice=><option key={choice.value} value={choice.value}>{choiceLabel(a,choice.value,locale)} ({countLabel(choice.count,locale)})</option>)}</select>)}
    <Link href="/collections" className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-[#b9dff0] bg-[#f4fbff] px-3 text-xs font-black text-[#002b5b]"><GalleryVerticalEnd className="h-3.5 w-3.5"/>{text(locale,"کالکشن‌ها","Collections","Koleksiyonlar","المجموعات")}</Link>
    <Link href="/rental" className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-[#001736] px-3 text-xs font-black text-white"><CalendarRange className="h-3.5 w-3.5"/>{text(locale,"درخواست اجاره","Rental request","Kiralama talebi","طلب إيجار")}</Link>
    {groups.map(group=>{const items=terms.filter(t=>t.dimension===group);return <details key={group} className="relative shrink-0"><summary className="cursor-pointer list-none rounded-full border bg-white px-3 py-2 text-xs font-bold text-[#43474f]">{names[group]?.[locale]??group}{items.some(x=>selected.has(x.id))?" ✓":""}</summary><div className="absolute z-50 mt-2 max-h-72 min-w-64 overflow-auto rounded-xl border bg-white p-2 shadow-xl">{items.map(item=><label key={item.id} className="flex cursor-pointer items-center justify-between gap-3 rounded-lg px-2 py-2 text-xs hover:bg-[#f1f4f7]"><span className="flex items-center gap-2"><input type="checkbox" checked={selected.has(item.id)} onChange={()=>toggle(item)}/><span>{label(item,locale)}</span></span><span className="rounded-full bg-[#eef3f9] px-2 py-0.5 text-[10px] font-black tabular-nums text-[#43474f]">{countLabel(item.count,locale)}</span></label>)}</div></details>})}
    {active?<button type="button" onClick={clear} className="inline-flex h-9 shrink-0 items-center gap-1 rounded-full bg-[#fff0f3] px-3 text-xs font-black text-[#920028]"><X className="h-3.5 w-3.5"/>{text(locale,"پاک کردن","Clear","Temizle","مسح")}</button>:null}
  </div></div></aside>;
}
