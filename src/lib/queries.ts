import "server-only";

import { inFilter, supabaseSelect } from "@/lib/supabase-rest";
import { applyProductInventory, applyVariantInventory, getStoreInventory } from "@/lib/store-inventory";

const PUBLIC_CATALOG_OR = "(isPublished.eq.true,catalogVisible.eq.true)";
const SAFE_UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SAFE_ENTITY_ID=/^[A-Za-z0-9_-]{1,128}$/;
const USE_FILTERS=new Set(["rental","professional","home"]);

function publicCatalogParams(extra:Record<string,string>={}){
  return { ...extra, or: PUBLIC_CATALOG_OR };
}

async function hydrateProducts(products:any[]){
  if(!products.length)return[];
  const productIds=products.map(p=>p.id);
  const categoryIds=[...new Set(products.map(p=>p.categoryId).filter(Boolean))];
  const brandIds=[...new Set(products.map(p=>p.brandId).filter(Boolean))];
  const[images,categories,brands]=await Promise.all([
    supabaseSelect<any>("Media",{select:"*",productId:inFilter(productIds),order:"sortOrder.asc"}),
    categoryIds.length?supabaseSelect<any>("Category",{select:"*",id:inFilter(categoryIds)}):Promise.resolve([]),
    brandIds.length?supabaseSelect<any>("Brand",{select:"*",id:inFilter(brandIds)}):Promise.resolve([]),
  ]);
  const categoriesById=new Map(categories.map(c=>[c.id,c]));
  const brandsById=new Map(brands.map(b=>[b.id,b]));
  const imagesByProductId=new Map<string,any[]>();
  for(const image of images){const list=imagesByProductId.get(image.productId)??[];list.push(image);imagesByProductId.set(image.productId,list)}
  return products.map(product=>({...product,commerceReady:product.isPublished===true,catalogOnly:product.catalogVisible===true&&product.isPublished!==true,images:imagesByProductId.get(product.id)??[],category:categoriesById.get(product.categoryId)??null,brandEntity:product.brandId?brandsById.get(product.brandId)??null:null}));
}

export async function getCategories(){
  try{
    const[categories,products,secondary]=await Promise.all([
      supabaseSelect<any>("Category",{select:"*",isPublished:"eq.true",order:"order.asc,createdAt.asc"}),
      supabaseSelect<any>("Product",publicCatalogParams({select:"id,categoryId"})),
      supabaseSelect<any>("ProductSecondaryCategory",{select:"productId,categoryId"}),
    ]);
    const visibleIds=new Set(products.map(product=>product.id));
    const memberships=new Map<string,Set<string>>();
    for(const product of products){const set=memberships.get(product.categoryId)??new Set<string>();set.add(product.id);memberships.set(product.categoryId,set)}
    for(const row of secondary){if(!visibleIds.has(row.productId))continue;const set=memberships.get(row.categoryId)??new Set<string>();set.add(row.productId);memberships.set(row.categoryId,set)}
    return categories.map(category=>({...category,_count:{products:memberships.get(category.id)?.size??0}}));
  }catch(error){console.error("[queries] categories Data API read failed",error);return[]}
}

export async function getCategoryBySlug(slug:string){
  try{const rows=await supabaseSelect<any>("Category",{select:"*",slug:`eq.${slug}`,isPublished:"eq.true",limit:"1"});return rows[0]??null}
  catch(error){console.error("[queries] category Data API read failed",error);return null}
}

function facetValue(row:any,type:string){
  if(type==="BOOLEAN")return row.valueBoolean==null?"":String(Boolean(row.valueBoolean));
  if(type==="NUMBER"){const n=Number(row.valueNumber);return Number.isFinite(n)?String(n):""}
  return String(row.valueText??"").trim();
}

export async function getCatalogFacets(){
  try{
    const visibleProducts=await supabaseSelect<any>("Product",publicCatalogParams({select:"id,brandId"}));
    if(!visibleProducts.length)return{brands:[],terms:[],attributes:[]};
    const productIds=visibleProducts.map(product=>product.id);
    const brandIds=[...new Set(visibleProducts.map(product=>product.brandId).filter(Boolean))];
    const[brands,links,definitions]=await Promise.all([
      brandIds.length?supabaseSelect<any>("Brand",{select:"id,name,slug",id:inFilter(brandIds),order:"name.asc"}):Promise.resolve([]),
      supabaseSelect<any>("ProductTaxonomy",{select:"productId,termId",productId:inFilter(productIds)}).catch(()=>[]),
      supabaseSelect<any>("ProductAttributeDefinition",{select:"id,code,nameFa,nameTr,nameEn,nameAr,dataType,unit,sortOrder",isPublished:"eq.true",isFilterable:"eq.true",order:"sortOrder.asc"}).catch(()=>[]),
    ]);
    const termIds=[...new Set(links.map((link:any)=>link.termId).filter(Boolean))];
    const terms=termIds.length?await supabaseSelect<any>("TaxonomyTerm",{select:"id,dimension,slug,nameFa,nameTr,nameEn,nameAr",id:inFilter(termIds),isPublished:"eq.true",order:"dimension.asc,sortOrder.asc"}).catch(()=>[]):[];
    const ids=definitions.map((d:any)=>d.id);
    const values=ids.length?await supabaseSelect<any>("ProductAttributeValue",{select:"productId,definitionId,valueText,valueNumber,valueBoolean",productId:inFilter(productIds),definitionId:inFilter(ids)}).catch(()=>[]):[];
    const byDef=new Map<string,Set<string>>();
    for(const row of values){
      const def=definitions.find((d:any)=>d.id===row.definitionId);if(!def)continue;
      const v=facetValue(row,def.dataType);if(!v)continue;
      const set=byDef.get(def.id)??new Set<string>();if(set.size<30)set.add(v);byDef.set(def.id,set);
    }
    const attributes=definitions.map((d:any)=>({...d,choices:[...(byDef.get(d.id)??new Set<string>())].sort((a,b)=>d.dataType==="NUMBER"?Number(a)-Number(b):a.localeCompare(b))})).filter((d:any)=>d.choices.length);
    return{brands,terms,attributes};
  }catch(error){console.error("[queries] catalog facets read failed",error);return{brands:[],terms:[],attributes:[]}}
}

export type AttributeCatalogFilter={definitionId:string;value:string};
export type ShopCatalogFilters={brandId:string;termIds:string[];use:string;attributes:AttributeCatalogFilter[]};
export type ShopFilterParams={brand?:string;taxonomy?:string|string[];use?:string;attribute?:string|string[]};

export function normalizeShopFilters(raw:ShopFilterParams={}):ShopCatalogFilters{
  const brand=typeof raw.brand==="string"?raw.brand:"";
  const use=typeof raw.use==="string"?raw.use:"";
  const taxRaw=Array.isArray(raw.taxonomy)?raw.taxonomy.join(","):raw.taxonomy??"";
  const attrRaw=Array.isArray(raw.attribute)?raw.attribute:raw.attribute?[raw.attribute]:[];
  const attributes:AttributeCatalogFilter[]=[];
  for(const token of attrRaw.slice(0,12)){
    const pos=token.indexOf("~");if(pos<1)continue;
    const definitionId=token.slice(0,pos),value=token.slice(pos+1).trim().slice(0,100);
    if(SAFE_UUID.test(definitionId)&&value)attributes.push({definitionId,value});
  }
  return{brandId:SAFE_ENTITY_ID.test(brand)?brand:"",termIds:String(taxRaw).split(",").filter(x=>SAFE_UUID.test(x)).slice(0,12),use:USE_FILTERS.has(use)?use:"",attributes};
}

export type ProductSort="newest"|"price-asc"|"price-desc";

function compareCatalogProducts(a:any,b:any,sort:ProductSort){
  if(sort==="price-asc"||sort==="price-desc"){
    const aCommerce=a.isPublished===true,bCommerce=b.isPublished===true;
    if(aCommerce!==bCommerce)return aCommerce?-1:1;
    if(aCommerce&&bCommerce)return sort==="price-asc"?a.price-b.price:b.price-a.price;
  }
  return new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime();
}

export async function getProducts(opts:{categorySlug?:string;sort?:ProductSort;search?:string;ignoreCatalogFilters?:boolean;filters?:ShopCatalogFilters}={}){
  const{categorySlug,sort="newest",search,ignoreCatalogFilters=false,filters={brandId:"",termIds:[],use:"",attributes:[]}}=opts;
  const q=search?.trim().toLocaleLowerCase();
  try{
    let categoryId:string|undefined;
    if(categorySlug){const category=await getCategoryBySlug(categorySlug);if(!category)return[];categoryId=category.id}
    const[rawProducts,snapshot]=await Promise.all([supabaseSelect<any>("Product",publicCatalogParams({select:"*"})),getStoreInventory()]);
    let products=rawProducts;
    if(categoryId){const secondary=await supabaseSelect<any>("ProductSecondaryCategory",{select:"productId",categoryId:`eq.${categoryId}`});const secondaryIds=new Set(secondary.map(r=>r.productId));products=products.filter(p=>p.categoryId===categoryId||secondaryIds.has(p.id))}
    if(!ignoreCatalogFilters){
      if(filters.brandId)products=products.filter(p=>p.brandId===filters.brandId);
      if(filters.use==="rental")products=products.filter(p=>p.rentalEligible===true);
      if(filters.use==="professional")products=products.filter(p=>p.professionalUse===true);
      if(filters.use==="home")products=products.filter(p=>p.homeUse===true);
      if(filters.termIds.length){
        const links=await supabaseSelect<any>("ProductTaxonomy",{select:"productId,termId",termId:inFilter(filters.termIds)});
        const byProduct=new Map<string,Set<string>>();for(const link of links){const set=byProduct.get(link.productId)??new Set<string>();set.add(link.termId);byProduct.set(link.productId,set)}
        products=products.filter(p=>filters.termIds.every(id=>byProduct.get(p.id)?.has(id)));
      }
      if(filters.attributes.length){
        const ids=[...new Set(filters.attributes.map(a=>a.definitionId))];
        const defs=await supabaseSelect<any>("ProductAttributeDefinition",{select:"id,dataType",id:inFilter(ids),isPublished:"eq.true",isFilterable:"eq.true"}).catch(()=>[]);
        const defMap=new Map(defs.map((d:any)=>[d.id,d]));
        const values=defs.length?await supabaseSelect<any>("ProductAttributeValue",{select:"productId,definitionId,valueText,valueNumber,valueBoolean",definitionId:inFilter(ids)}).catch(()=>[]):[];
        const byProduct=new Map<string,Map<string,string>>();
        for(const row of values){const def:any=defMap.get(row.definitionId);if(!def)continue;const map=byProduct.get(row.productId)??new Map<string,string>();map.set(row.definitionId,facetValue(row,def.dataType));byProduct.set(row.productId,map)}
        products=products.filter(p=>filters.attributes.every(a=>byProduct.get(p.id)?.get(a.definitionId)===a.value));
      }
    }
    const hydrated=await hydrateProducts(applyProductInventory(products,snapshot));
    products=q?hydrated.filter(product=>[product.nameFa,product.nameTr,product.nameEn,product.nameAr,product.brandEntity?.name,product.brand,product.modelNumber,product.sku].some(value=>String(value??"").toLocaleLowerCase().includes(q))):hydrated;
    products.sort((a,b)=>compareCatalogProducts(a,b,sort));
    return products;
  }catch(error){console.error("[queries] products Data API read failed",error);return[]}
}

export async function getFeaturedProducts(take=8){
  try{
    const[products,snapshot]=await Promise.all([supabaseSelect<any>("Product",publicCatalogParams({select:"*",isFeatured:"eq.true"})),getStoreInventory()]);
    products.sort((a,b)=>a.isNewArrival!==b.isNewArrival?(a.isNewArrival?-1:1):new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime());
    return await hydrateProducts(applyProductInventory(products.slice(0,take),snapshot));
  }catch(error){console.error("[queries] featured products Data API read failed",error);return[]}
}

export async function getProductBySlug(slug:string){
  try{
    const[rows,snapshot]=await Promise.all([supabaseSelect<any>("Product",publicCatalogParams({select:"*",slug:`eq.${slug}`,limit:"1"})),getStoreInventory()]);
    const product=rows[0];if(!product)return null;
    const[hydrated]=await hydrateProducts(applyProductInventory([product],snapshot));
    const[rawVariants,reviews,taxonomy,attributeValues,relations]=await Promise.all([
      product.isPublished===true?supabaseSelect<any>("ProductVariant",{select:"*",productId:`eq.${product.id}`,isPublished:"eq.true",order:"createdAt.asc"}):Promise.resolve([]),
      supabaseSelect<any>("Review",{select:"*",productId:`eq.${product.id}`,status:"eq.APPROVED",order:"createdAt.desc",limit:"12"}),
      supabaseSelect<any>("ProductTaxonomy",{select:"termId",productId:`eq.${product.id}`}),
      supabaseSelect<any>("ProductAttributeValue",{select:"definitionId,valueText,valueNumber,valueBoolean",productId:`eq.${product.id}`}).catch(()=>[]),
      supabaseSelect<any>("ProductRelation",{select:"relatedProductId,relationType,sortOrder",productId:`eq.${product.id}`,order:"sortOrder.asc,createdAt.asc"}).catch(()=>[]),
    ]);
    const variants=applyVariantInventory(rawVariants,snapshot);
    let taxonomyTerms:any[]=[];const termIds=taxonomy.map(x=>x.termId);
    if(termIds.length)taxonomyTerms=await supabaseSelect<any>("TaxonomyTerm",{select:"*",id:inFilter(termIds),isPublished:"eq.true",order:"dimension.asc,sortOrder.asc"});
    let structuredAttributes:any[]=[];const definitionIds=attributeValues.map(x=>x.definitionId).filter(Boolean);
    if(definitionIds.length){
      const definitions=await supabaseSelect<any>("ProductAttributeDefinition",{select:"id,code,nameFa,nameTr,nameEn,nameAr,groupFa,groupTr,groupEn,groupAr,dataType,unit,isComparable,isFilterable,sortOrder",id:inFilter(definitionIds),isPublished:"eq.true",order:"sortOrder.asc"});
      const valueByDefinition=new Map(attributeValues.map(v=>[v.definitionId,v]));structuredAttributes=definitions.map(definition=>({...definition,...(valueByDefinition.get(definition.id)??{})}));
    }
    let catalogRelations:any[]=[];const relationIds=[...new Set(relations.map(r=>r.relatedProductId).filter(Boolean))];
    if(relationIds.length){
      const targets=await supabaseSelect<any>("Product",publicCatalogParams({select:"*",id:inFilter(relationIds)}));
      const hydratedTargets=await hydrateProducts(applyProductInventory(targets,snapshot));const byId=new Map(hydratedTargets.map(p=>[p.id,p]));
      catalogRelations=relations.map(r=>({relationType:r.relationType,sortOrder:r.sortOrder,product:byId.get(r.relatedProductId)})).filter(r=>Boolean(r.product));
    }
    return{...hydrated,variants,reviews,taxonomyTerms,structuredAttributes,catalogRelations};
  }catch(error){console.error("[queries] product Data API read failed",error);return null}
}

export async function getRelatedProducts(categoryId:string,excludeId:string,take=4){
  try{
    const[relations,snapshot]=await Promise.all([supabaseSelect<any>("ProductRelation",{select:"relatedProductId,relationType,sortOrder",productId:`eq.${excludeId}`,order:"sortOrder.asc,createdAt.asc"}).catch(()=>[]),getStoreInventory()]);
    const relationIds=relations.map(r=>r.relatedProductId).filter(Boolean);let prioritized:any[]=[];
    if(relationIds.length){const targets=await supabaseSelect<any>("Product",publicCatalogParams({select:"*",id:inFilter(relationIds)}));const byId=new Map(targets.map(p=>[p.id,p]));prioritized=relationIds.map(id=>byId.get(id)).filter(Boolean)}
    if(prioritized.length>=take)return await hydrateProducts(applyProductInventory(prioritized.slice(0,take),snapshot));
    let products=await supabaseSelect<any>("Product",publicCatalogParams({select:"*"}));
    const secondary=await supabaseSelect<any>("ProductSecondaryCategory",{select:"productId",categoryId:`eq.${categoryId}`});const ids=new Set(secondary.map(r=>r.productId)),used=new Set([excludeId,...prioritized.map(p=>p.id)]);
    products=products.filter(p=>!used.has(p.id)&&(p.categoryId===categoryId||ids.has(p.id)));
    products.sort((a,b)=>a.isFeatured!==b.isFeatured?(a.isFeatured?-1:1):new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime());
    return await hydrateProducts(applyProductInventory([...prioritized,...products].slice(0,take),snapshot));
  }catch(error){console.error("[queries] related products Data API read failed",error);return[]}
}

export async function getServices(){try{return await supabaseSelect<any>("Service",{select:"*",isPublished:"eq.true",order:"createdAt.asc"})}catch(error){console.error("[queries] services Data API read failed",error);return[]}}
export async function getServiceBySlug(slug:string){try{const rows=await supabaseSelect<any>("Service",{select:"*",slug:`eq.${slug}`,isPublished:"eq.true",limit:"1"});return rows[0]??null}catch(error){console.error("[queries] service Data API read failed",error);return null}}
export async function getPageBySlug(slug:string){try{const rows=await supabaseSelect<any>("Page",{select:"*",slug:`eq.${slug}`,isPublished:"eq.true",limit:"1"});return rows[0]??null}catch(error){console.error("[queries] page Data API read failed",error);return null}}
function articleIsPublic(article:any,now=Date.now()){if(!article?.isPublished)return false;if(!article.publishedAt)return true;const publishedAt=new Date(article.publishedAt).getTime();return Number.isFinite(publishedAt)&&publishedAt<=now}
export async function getPublishedArticles(take=12){try{const articles=await supabaseSelect<any>("Article",{select:"*",isPublished:"eq.true",order:"publishedAt.desc,createdAt.desc"});return articles.filter(article=>articleIsPublic(article)).slice(0,take)}catch(error){console.error("[queries] articles Data API read failed",error);return[]}}
export async function getArticleBySlug(slug:string){try{const rows=await supabaseSelect<any>("Article",{select:"*",slug:`eq.${slug}`,isPublished:"eq.true",limit:"1"}),article=rows[0]??null;return articleIsPublic(article)?article:null}catch(error){console.error("[queries] article Data API read failed",error);return null}}
