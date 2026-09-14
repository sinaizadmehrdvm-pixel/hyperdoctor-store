import type { Metadata } from "next";
import { CatalogStorefrontV286 } from "@/components/site/catalog-storefront-v286";

type SP={q?:string;brand?:string;sort?:string};

export async function generateMetadata({params,searchParams}:{params:Promise<{locale:string}>;searchParams:Promise<SP>}):Promise<Metadata>{
  const[{locale},sp]=await Promise.all([params,searchParams]);
  const faceted=Boolean(sp.q||sp.brand||sp.sort);
  return{alternates:{canonical:`/${locale}/shop`},...(faceted?{robots:{index:false,follow:true}}:{})};
}

export default async function ShopPage({params,searchParams}:{params:Promise<{locale:string}>;searchParams:Promise<SP>}){
  const{locale}=await params;
  return <CatalogStorefrontV286 locale={locale} searchParams={searchParams}/>;
}
