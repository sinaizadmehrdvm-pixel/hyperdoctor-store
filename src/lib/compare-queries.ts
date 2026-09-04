import "server-only";
import { getProducts } from "@/lib/queries";
import { inFilter, supabaseSelect } from "@/lib/supabase-rest";

export async function getCompareProducts(){
  const products=await getProducts({ignoreCatalogFilters:true});
  if(!products.length)return [];
  const ids=products.map(p=>p.id);
  const[taxonomyLinks,attributeValues]=await Promise.all([
    supabaseSelect<any>("ProductTaxonomy",{select:"productId,termId",productId:inFilter(ids)}),
    supabaseSelect<any>("ProductAttributeValue",{select:"productId,definitionId,valueText,valueNumber,valueBoolean",productId:inFilter(ids)}).catch(()=>[])
  ]);
  const termIds=[...new Set(taxonomyLinks.map(x=>x.termId).filter(Boolean))];
  const definitionIds=[...new Set(attributeValues.map(x=>x.definitionId).filter(Boolean))];
  const[terms,definitions]=await Promise.all([
    termIds.length?supabaseSelect<any>("TaxonomyTerm",{select:"id,dimension,nameFa,nameTr,nameEn,nameAr",id:inFilter(termIds),isPublished:"eq.true"}):Promise.resolve([]),
    definitionIds.length?supabaseSelect<any>("ProductAttributeDefinition",{select:"id,code,nameFa,nameTr,nameEn,nameAr,groupFa,groupTr,groupEn,groupAr,dataType,unit,isComparable,isFilterable,sortOrder",id:inFilter(definitionIds),isPublished:"eq.true",isComparable:"eq.true",order:"sortOrder.asc"}):Promise.resolve([])
  ]);
  const termById=new Map(terms.map(t=>[t.id,t])),definitionById=new Map(definitions.map(d=>[d.id,d]));
  const taxonomyByProduct=new Map<string,any[]>(),attributesByProduct=new Map<string,any[]>();
  for(const link of taxonomyLinks){const term=termById.get(link.termId);if(!term)continue;const list=taxonomyByProduct.get(link.productId)??[];list.push(term);taxonomyByProduct.set(link.productId,list)}
  for(const value of attributeValues){const definition=definitionById.get(value.definitionId);if(!definition)continue;const list=attributesByProduct.get(value.productId)??[];list.push({...definition,valueText:value.valueText,valueNumber:value.valueNumber,valueBoolean:value.valueBoolean});attributesByProduct.set(value.productId,list)}
  return products.map(product=>({...product,taxonomyTerms:taxonomyByProduct.get(product.id)??[],structuredAttributes:attributesByProduct.get(product.id)??[]}));
}
