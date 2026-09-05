import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ShopContent } from "@/components/site/shop-content";
import { getCategoryBySlug, normalizeShopFilters, type ProductSort } from "@/lib/queries";
const SORT_VALUES=new Set<ProductSort>(["newest","price-asc","price-desc"]),MAX_SEARCH_LENGTH=120,SAFE_SLUG=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;
function normalizeSort(value?:string):ProductSort{return value&&SORT_VALUES.has(value as ProductSort)?value as ProductSort:"newest"}
function normalizeSearch(value?:string){const normalized=value?.trim().replace(/\s+/g," ");return normalized?normalized.slice(0,MAX_SEARCH_LENGTH):undefined}
type SP={sort?:string;q?:string;brand?:string;taxonomy?:string|string[];use?:string;attribute?:string|string[]};
export async function generateMetadata({searchParams}:{searchParams:Promise<SP>}):Promise<Metadata>{const sp=await searchParams;const faceted=Boolean(sp.q||sp.sort||sp.brand||sp.taxonomy||sp.use||sp.attribute);return faceted?{robots:{index:false,follow:true}}:{}}
export default async function ShopCategoryPage({params,searchParams}:{params:Promise<{categorySlug:string}>;searchParams:Promise<SP>}){const{categorySlug}=await params,sp=await searchParams;if(!SAFE_SLUG.test(categorySlug))notFound();const category=await getCategoryBySlug(categorySlug);if(!category)notFound();return <ShopContent categorySlug={categorySlug} sort={normalizeSort(sp.sort)} search={normalizeSearch(sp.q)} filters={normalizeShopFilters(sp)}/>}
