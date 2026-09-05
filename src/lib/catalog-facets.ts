import "server-only";
import { inFilter, supabaseSelect } from "@/lib/supabase-rest";

function facetValue(row:any,type:string){
  if(type==="BOOLEAN")return row.valueBoolean==null?"":String(Boolean(row.valueBoolean));
  if(type==="NUMBER"){const n=Number(row.valueNumber);return Number.isFinite(n)?String(n):""}
  return String(row.valueText??"").trim();
}

export async function getPublishedCatalogFacets(){
  try{
    const products=await supabaseSelect<any>("Product",{select:"id,brandId",isPublished:"eq.true"});
    if(!products.length)return{brands:[],terms:[],attributes:[]};
    const productIds=products.map(p=>p.id),usedBrandIds=[...new Set(products.map(p=>p.brandId).filter(Boolean))];
    const[taxonomyLinks,definitions]=await Promise.all([
      supabaseSelect<any>("ProductTaxonomy",{select:"productId,termId",productId:inFilter(productIds)}).catch(()=>[]),
      supabaseSelect<any>("ProductAttributeDefinition",{select:"id,code,nameFa,nameTr,nameEn,nameAr,dataType,unit,sortOrder",isPublished:"eq.true",isFilterable:"eq.true",order:"sortOrder.asc"}).catch(()=>[]),
    ]);
    const usedTermIds=[...new Set(taxonomyLinks.map((x:any)=>x.termId).filter(Boolean))];
    const definitionIds=definitions.map((d:any)=>d.id);
    const[brands,terms,values]=await Promise.all([
      usedBrandIds.length?supabaseSelect<any>("Brand",{select:"id,name,slug",id:inFilter(usedBrandIds),isPublished:"eq.true",order:"name.asc"}):Promise.resolve([]),
      usedTermIds.length?supabaseSelect<any>("TaxonomyTerm",{select:"id,dimension,slug,nameFa,nameTr,nameEn,nameAr",id:inFilter(usedTermIds),isPublished:"eq.true",order:"dimension.asc,sortOrder.asc"}):Promise.resolve([]),
      definitionIds.length?supabaseSelect<any>("ProductAttributeValue",{select:"productId,definitionId,valueText,valueNumber,valueBoolean",productId:inFilter(productIds),definitionId:inFilter(definitionIds)}).catch(()=>[]):Promise.resolve([]),
    ]);
    const byDefinition=new Map<string,Set<string>>(),definitionById=new Map(definitions.map((d:any)=>[d.id,d]));
    for(const row of values){
      const def:any=definitionById.get(row.definitionId);if(!def)continue;
      const value=facetValue(row,def.dataType);if(!value)continue;
      const set=byDefinition.get(def.id)??new Set<string>();if(set.size<50)set.add(value);byDefinition.set(def.id,set);
    }
    const attributes=definitions.map((d:any)=>({...d,choices:[...(byDefinition.get(d.id)??new Set<string>())].sort((a,b)=>d.dataType==="NUMBER"?Number(a)-Number(b):a.localeCompare(b))})).filter((d:any)=>d.choices.length);
    return{brands,terms,attributes};
  }catch(error){console.error("[catalog] published facets read failed",error);return{brands:[],terms:[],attributes:[]}}
}
