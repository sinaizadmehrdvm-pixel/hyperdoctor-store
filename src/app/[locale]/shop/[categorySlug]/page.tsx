import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CatalogStorefrontV286 } from "@/components/site/catalog-storefront-v286";
import { getCatalogV286 } from "@/lib/catalog-v286";

const SAFE_SLUG=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;
type SP={q?:string;brand?:string;sort?:string};

export async function generateMetadata({params,searchParams}:{params:Promise<{locale:string;categorySlug:string}>;searchParams:Promise<SP>}):Promise<Metadata>{
  const[{locale,categorySlug},sp]=await Promise.all([params,searchParams]);
  const faceted=Boolean(sp.q||sp.brand||sp.sort);
  return{alternates:{canonical:`/${locale}/shop/${categorySlug}`},...(faceted?{robots:{index:false,follow:true}}:{})};
}

export default async function ShopCategoryPage({params,searchParams}:{params:Promise<{locale:string;categorySlug:string}>;searchParams:Promise<SP>}){
  const{locale,categorySlug}=await params;if(!SAFE_SLUG.test(categorySlug))notFound();
  const check=await getCatalogV286({categorySlug});if(check.status==="ok"&&!check.activeCategory)notFound();
  return <CatalogStorefrontV286 locale={locale} categorySlug={categorySlug} searchParams={searchParams}/>;
}
