import type { Metadata } from "next";
import { ShopContent } from "@/components/site/shop-content";
import { normalizeShopFilters, type ProductSort } from "@/lib/queries";
const SORT_VALUES=new Set<ProductSort>(["newest","price-asc","price-desc"]),MAX_SEARCH_LENGTH=120;
function normalizeSort(value?:string):ProductSort{return value&&SORT_VALUES.has(value as ProductSort)?value as ProductSort:"newest"}
function normalizeSearch(value?:string){const normalized=value?.trim().replace(/\s+/g," ");return normalized?normalized.slice(0,MAX_SEARCH_LENGTH):undefined}
type SP={sort?:string;q?:string;brand?:string;taxonomy?:string|string[];use?:string;attribute?:string|string[]};
export async function generateMetadata({searchParams}:{searchParams:Promise<SP>}):Promise<Metadata>{const sp=await searchParams;const faceted=Boolean(sp.q||sp.sort||sp.brand||sp.taxonomy||sp.use||sp.attribute);return faceted?{robots:{index:false,follow:true}}:{}}
export default async function ShopPage({searchParams}:{searchParams:Promise<SP>}){const sp=await searchParams;return <ShopContent sort={normalizeSort(sp.sort)} search={normalizeSearch(sp.q)} filters={normalizeShopFilters(sp)}/>}
