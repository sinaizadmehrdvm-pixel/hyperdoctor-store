import "server-only";
import { inFilter, supabaseSelect } from "@/lib/supabase-rest";
import { applyProductInventory, getStoreInventory } from "@/lib/store-inventory";

async function hydrateCollectionProducts(ids:string[]){
  if(!ids.length)return[];
  const[rawProducts,snapshot]=await Promise.all([
    supabaseSelect<any>("Product",{select:"*",id:inFilter(ids),isPublished:"eq.true"}),
    getStoreInventory(),
  ]);
  const products=applyProductInventory(rawProducts,snapshot);
  const images=await supabaseSelect<any>("Media",{select:"*",productId:inFilter(ids),order:"sortOrder.asc"});
  const brands=[...new Set(products.map(p=>p.brandId).filter(Boolean))];
  const brandRows=brands.length?await supabaseSelect<any>("Brand",{select:"id,name,slug,logoUrl",id:inFilter(brands),isPublished:"eq.true"}):[];
  const byId=new Map(products.map(p=>[p.id,p])),byBrand=new Map(brandRows.map(b=>[b.id,b])),byImages=new Map<string,any[]>();
  for(const i of images){const a=byImages.get(i.productId)||[];a.push(i);byImages.set(i.productId,a)}
  return ids.map(id=>byId.get(id)).filter(Boolean).map((p:any)=>({...p,images:byImages.get(p.id)||[],brandEntity:p.brandId?byBrand.get(p.brandId)||null:null}));
}

export async function getPublicCollections(limit=24){
  try{
    const collections=await supabaseSelect<any>("Collection",{select:"*",isPublished:"eq.true",order:"sortOrder.asc,createdAt.desc",limit:String(Math.max(1,Math.min(100,limit)))});
    if(!collections.length)return[];
    const ids=collections.map(c=>c.id);
    const links=await supabaseSelect<any>("CollectionProduct",{select:"collectionId,productId,sortOrder",collectionId:inFilter(ids),order:"sortOrder.asc"});
    const publishedProducts=links.length?await supabaseSelect<any>("Product",{select:"id",id:inFilter([...new Set(links.map(x=>x.productId))]),isPublished:"eq.true"}):[];
    const publishedIds=new Set(publishedProducts.map(p=>p.id));
    const counts=new Map<string,number>();
    for(const link of links)if(publishedIds.has(link.productId))counts.set(link.collectionId,(counts.get(link.collectionId)||0)+1);
    return collections.map(c=>({...c,productCount:counts.get(c.id)||0}));
  }catch(error){console.error("[catalog] public collections read failed",error);return[]}
}

export async function getPublicCollectionBySlug(slug:string){
  const rows=await supabaseSelect<any>("Collection",{select:"*",slug:`eq.${slug}`,isPublished:"eq.true",limit:"1"});const collection=rows[0];if(!collection)return null;
  const links=await supabaseSelect<any>("CollectionProduct",{select:"productId,sortOrder",collectionId:`eq.${collection.id}`,order:"sortOrder.asc"});
  const ids=links.map(x=>x.productId).filter(Boolean);
  return{collection,products:await hydrateCollectionProducts(ids)};
}

export async function getPublicProductCollections(productId:string){
  try{
    const links=await supabaseSelect<any>("CollectionProduct",{select:"collectionId,sortOrder",productId:`eq.${productId}`,order:"sortOrder.asc"});
    const ids=[...new Set(links.map(x=>x.collectionId).filter(Boolean))];
    if(!ids.length)return[];
    const rows=await supabaseSelect<any>("Collection",{select:"id,slug,titleFa,titleTr,titleEn,titleAr,heroImageUrl,sortOrder",id:inFilter(ids),isPublished:"eq.true",order:"sortOrder.asc"});
    const byId=new Map(rows.map(x=>[x.id,x]));
    return ids.map(id=>byId.get(id)).filter(Boolean);
  }catch(error){console.error("[catalog] product collections read failed",error);return[]}
}

export async function getPublicProductAttributes(productId:string){const values=await supabaseSelect<any>("ProductAttributeValue",{select:"*",productId:`eq.${productId}`});if(!values.length)return[];const defs=await supabaseSelect<any>("ProductAttributeDefinition",{select:"*",id:inFilter(values.map(v=>v.definitionId)),isPublished:"eq.true",order:"sortOrder.asc"});const by=new Map(values.map(v=>[v.definitionId,v]));return defs.map(d=>({definition:d,value:by.get(d.id)}));}
