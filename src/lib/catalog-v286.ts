import "server-only";
import { inFilter, supabaseSelect } from "@/lib/supabase-rest";

const PREFIX="media-v285-";

async function verifiedMediaByProduct(){
  const [evidence,blobs]=await Promise.all([
    supabaseSelect<any>("ProductMediaEvidence",{select:"productId,mediaId",verificationStatus:"eq.VERIFIED"}),
    supabaseSelect<any>("ProductMediaBlob",{select:"mediaId,mimeType,byteSize,sha256"}),
  ]);
  const valid=new Set(blobs.filter(b=>String(b.mediaId).startsWith(PREFIX)&&b.mimeType==="image/webp"&&Number(b.byteSize)>0&&String(b.sha256).length===64).map(b=>b.mediaId));
  const byProduct=new Map<string,string[]>();
  for(const row of evidence){
    if(!String(row.mediaId).startsWith(PREFIX)||!valid.has(row.mediaId))continue;
    const list=byProduct.get(row.productId)??[];list.push(row.mediaId);byProduct.set(row.productId,list);
  }
  return byProduct;
}

async function hydrate(products:any[],mediaMap:Map<string,string[]>){
  if(!products.length)return[];
  const ids=products.map(p=>p.id),categoryIds=[...new Set(products.map(p=>p.categoryId).filter(Boolean))],brandIds=[...new Set(products.map(p=>p.brandId).filter(Boolean))];
  const [media,categories,brands]=await Promise.all([
    supabaseSelect<any>("Media",{select:"id,url,altFa,altTr,altEn,altAr,productId,sortOrder",productId:inFilter(ids),order:"sortOrder.asc"}),
    categoryIds.length?supabaseSelect<any>("Category",{select:"id,slug,nameFa,nameTr,nameEn,nameAr,isPublished,order",id:inFilter(categoryIds)}):Promise.resolve([]),
    brandIds.length?supabaseSelect<any>("Brand",{select:"id,name,slug,isPublished",id:inFilter(brandIds)}):Promise.resolve([]),
  ]);
  const mediaById=new Map(media.map(m=>[m.id,m])),catById=new Map(categories.map(c=>[c.id,c])),brandById=new Map(brands.map(b=>[b.id,b]));
  return products.map(p=>({...p,images:(mediaMap.get(p.id)??[]).map(id=>mediaById.get(id)).filter(Boolean),category:catById.get(p.categoryId)??null,brandEntity:p.brandId?brandById.get(p.brandId)??null:null,catalogVerified:true,commerceReady:p.isPublished===true&&Number(p.price)>0&&p.storeCheckoutEnabled===true}));
}

export async function getCatalogV286(opts:{categorySlug?:string;q?:string;brand?:string;sort?:string}={}){
  const mediaMap=await verifiedMediaByProduct(),ids=[...mediaMap.keys()];
  if(!ids.length)return{products:[],categories:[],brands:[],total:0};
  const raw=await supabaseSelect<any>("Product",{select:"*",id:inFilter(ids)}),all=await hydrate(raw,mediaMap);
  const categories=await supabaseSelect<any>("Category",{select:"id,slug,nameFa,nameTr,nameEn,nameAr,isPublished,order",isPublished:"eq.true",order:"order.asc,createdAt.asc"});
  const active=opts.categorySlug?categories.find(c=>c.slug===opts.categorySlug):null;
  let products=all;
  if(opts.categorySlug)products=active?products.filter(p=>p.categoryId===active.id):[];
  if(opts.brand)products=products.filter(p=>p.brandId===opts.brand);
  const q=opts.q?.trim().replace(/\s+/g," ").slice(0,120).toLocaleLowerCase();
  if(q)products=products.filter(p=>[p.nameFa,p.nameTr,p.nameEn,p.nameAr,p.modelNumber,p.sku,p.brand,p.brandEntity?.name].some(v=>String(v??"").toLocaleLowerCase().includes(q)));
  products.sort(opts.sort==="name"?(a,b)=>String(a.nameEn??a.nameFa).localeCompare(String(b.nameEn??b.nameFa)):(a,b)=>new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime());
  const catCount=new Map<string,number>(),brandCount=new Map<string,number>();for(const p of all){catCount.set(p.categoryId,(catCount.get(p.categoryId)??0)+1);if(p.brandId)brandCount.set(p.brandId,(brandCount.get(p.brandId)??0)+1)}
  const visibleCategories=categories.map(c=>({...c,count:catCount.get(c.id)??0})).filter(c=>c.count>0);
  const brands=[...new Map(all.filter(p=>p.brandEntity?.id).map(p=>[p.brandEntity.id,p.brandEntity])).values()].map((b:any)=>({...b,count:brandCount.get(b.id)??0})).sort((a:any,b:any)=>String(a.name).localeCompare(String(b.name)));
  return{products,categories:visibleCategories,brands,total:products.length,activeCategory:active??null};
}

export async function getCatalogProductV286(slug:string){
  const rows=await supabaseSelect<any>("Product",{select:"*",slug:`eq.${slug}`,limit:"1"}),product=rows[0];if(!product)return null;
  const mediaMap=await verifiedMediaByProduct();if(!mediaMap.has(product.id))return null;
  const [hydrated]=await hydrate([product],mediaMap);return hydrated??null;
}
