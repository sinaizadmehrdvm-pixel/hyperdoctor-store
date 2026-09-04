import "server-only";
import { getProducts } from "@/lib/queries";
import { inFilter, supabaseSelect } from "@/lib/supabase-rest";

export async function getCompareProducts(){
  const products=await getProducts({ignoreCatalogFilters:true});
  if(!products.length)return [];
  const ids=products.map(p=>p.id);
  const links=await supabaseSelect<any>("ProductTaxonomy",{select:"productId,termId",productId:inFilter(ids)});
  const termIds=[...new Set(links.map(x=>x.termId).filter(Boolean))];
  const terms=termIds.length?await supabaseSelect<any>("TaxonomyTerm",{select:"id,dimension,nameFa,nameTr,nameEn,nameAr",id:inFilter(termIds),isPublished:"eq.true"}):[];
  const termById=new Map(terms.map(t=>[t.id,t]));
  const byProduct=new Map<string,any[]>();
  for(const link of links){const term=termById.get(link.termId);if(!term)continue;const list=byProduct.get(link.productId)??[];list.push(term);byProduct.set(link.productId,list)}
  return products.map(product=>({...product,taxonomyTerms:byProduct.get(product.id)??[]}));
}
