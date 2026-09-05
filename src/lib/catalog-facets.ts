import "server-only";
import { supabaseRpc } from "@/lib/supabase-rest";
import type { ShopCatalogFilters } from "@/lib/queries";

export type CatalogFacetBrand={id:string;name:string;slug:string;count:number};
export type CatalogFacetTerm={id:string;dimension:string;slug:string;nameFa:string;nameTr:string;nameEn:string;nameAr:string;count:number};
export type CatalogFacetChoice={value:string;count:number};
export type CatalogFacetAttribute={id:string;code:string;nameFa:string;nameTr:string;nameEn:string;nameAr:string;dataType:string;unit?:string|null;choices:CatalogFacetChoice[]};
export type CatalogUseFacet={value:"rental"|"professional"|"home";count:number};
export type ContextualCatalogFacets={resultCount:number;brands:CatalogFacetBrand[];terms:CatalogFacetTerm[];attributes:CatalogFacetAttribute[];useProfiles:CatalogUseFacet[]};

const EMPTY:ContextualCatalogFacets={resultCount:0,brands:[],terms:[],attributes:[],useProfiles:[]};

export async function getContextualCatalogFacets(opts:{categorySlug?:string;search?:string;filters?:ShopCatalogFilters}={}):Promise<ContextualCatalogFacets>{
  const filters=opts.filters??{brandId:"",termIds:[],use:"",attributes:[]};
  try{
    const data=await supabaseRpc<ContextualCatalogFacets>("public_catalog_facets_v2",{
      p_category_slug:opts.categorySlug??null,
      p_search:opts.search??null,
      p_brand_id:filters.brandId||null,
      p_term_ids:filters.termIds.slice(0,12),
      p_use:filters.use||null,
      p_attributes:filters.attributes.slice(0,12).map(item=>({definitionId:item.definitionId,value:item.value})),
    });
    return{
      resultCount:Math.max(0,Number(data?.resultCount)||0),
      brands:Array.isArray(data?.brands)?data.brands:[],
      terms:Array.isArray(data?.terms)?data.terms:[],
      attributes:Array.isArray(data?.attributes)?data.attributes:[],
      useProfiles:Array.isArray(data?.useProfiles)?data.useProfiles:[],
    };
  }catch(error){console.error("[catalog] contextual facets read failed",error);return EMPTY}
}
