import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { ShopContent } from "@/components/site/shop-content";
import { CatalogFilterBar } from "@/components/site/catalog-filter-bar";
import { getContextualCatalogFacets } from "@/lib/catalog-facets";
import { normalizeShopFilters, type ProductSort } from "@/lib/queries";

const SORT_VALUES=new Set<ProductSort>(["newest","price-asc","price-desc"]),MAX_SEARCH_LENGTH=120;
function normalizeSort(value?:string):ProductSort{return value&&SORT_VALUES.has(value as ProductSort)?value as ProductSort:"newest"}
function normalizeSearch(value?:string){const normalized=value?.trim().replace(/\s+/g," ");return normalized?normalized.slice(0,MAX_SEARCH_LENGTH):undefined}
type SP={sort?:string;q?:string;brand?:string;taxonomy?:string|string[];use?:string;attribute?:string|string[]};

export async function generateMetadata({params,searchParams}:{params:Promise<{locale:string}>;searchParams:Promise<SP>}):Promise<Metadata>{
  const[{locale},sp]=await Promise.all([params,searchParams]);
  const faceted=Boolean(sp.q||sp.sort||sp.brand||sp.taxonomy||sp.use||sp.attribute);
  return{alternates:{canonical:`/${locale}/shop`},...(faceted?{robots:{index:false,follow:true}}:{})};
}

export default async function ShopPage({searchParams}:{searchParams:Promise<SP>}){
  const sp=await searchParams,filters=normalizeShopFilters(sp),search=normalizeSearch(sp.q),sort=normalizeSort(sp.sort);
  const[locale,facets]=await Promise.all([getLocale(),getContextualCatalogFacets({search,filters})]);
  return <><CatalogFilterBar locale={locale} brands={facets.brands} terms={facets.terms} attributes={facets.attributes} useProfiles={facets.useProfiles} resultCount={facets.resultCount}/><ShopContent sort={sort} search={search} filters={filters}/></>;
}
