import type {Metadata} from "next";
import {notFound} from "next/navigation";
import {Container} from "@/components/ui/container";
import {ShopProductCard} from "@/components/site/shop-product-card";
import {getPublicCollectionBySlug} from "@/lib/catalog-extensions";
import {isValidSlug} from "@/lib/slug";

function pick(x:any,locale:string,key:string){const suffix=locale==="fa"?"Fa":locale==="tr"?"Tr":locale==="ar"?"Ar":"En";return x?.[`${key}${suffix}`]||x?.[`${key}En`]||x?.[`${key}Fa`]||""}

export async function generateMetadata({params}:{params:Promise<{locale:string;slug:string}>}):Promise<Metadata>{
  const{locale,slug}=await params;if(!isValidSlug(slug))return{};
  const result=await getPublicCollectionBySlug(slug);if(!result)return{};
  const title=pick(result.collection,locale,"seoTitle")||pick(result.collection,locale,"title"),description=pick(result.collection,locale,"seoDescription")||pick(result.collection,locale,"description")||undefined;
  return{title,description,alternates:{canonical:`/${locale}/collection/${slug}`},openGraph:{title,description,type:"website",images:result.collection.heroImageUrl?[result.collection.heroImageUrl]:undefined}};
}

export default async function CollectionPage({params}:{params:Promise<{locale:string;slug:string}>}){
  const{locale,slug}=await params;if(!isValidSlug(slug))notFound();
  const result=await getPublicCollectionBySlug(slug);if(!result)notFound();
  const collection=result.collection,title=pick(collection,locale,"title"),description=pick(collection,locale,"description");
  const structured={"@context":"https://schema.org","@type":"CollectionPage",name:title,description:description||undefined,image:collection.heroImageUrl||undefined,mainEntity:{"@type":"ItemList",numberOfItems:result.products.length,itemListElement:result.products.map((product:any,index:number)=>({"@type":"ListItem",position:index+1,name:pick(product,locale,"name"),url:`/${locale}/product/${product.slug}`}))}};
  return <main className="flex-1 bg-[#f7fafd]"><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(structured).replace(/</g,"\\u003c")}}/><section className="relative overflow-hidden border-b bg-[#001736] text-white">{collection.heroImageUrl?<div className="absolute inset-0 bg-cover bg-center opacity-25" style={{backgroundImage:`url(${collection.heroImageUrl})`}}/>:null}<Container><div className="relative py-16 sm:py-20 lg:py-24"><p className="text-xs font-black uppercase tracking-[.2em] text-[#63d6ff]">HYPER DOCTOR COLLECTION</p><h1 className="mt-4 max-w-4xl text-4xl font-black leading-tight sm:text-5xl">{title}</h1>{description?<p className="mt-5 max-w-3xl whitespace-pre-line text-sm leading-8 text-white/80 sm:text-base">{description}</p>:null}</div></Container></section><Container><section className="py-10 sm:py-14"><div className="mb-6 flex items-end justify-between gap-4"><div><h2 className="text-2xl font-black text-[#001736]">{locale==="fa"?"محصولات این کالکشن":locale==="tr"?"Koleksiyon ürünleri":locale==="ar"?"منتجات المجموعة":"Collection products"}</h2><p className="mt-1 text-xs text-[#747780]">{new Intl.NumberFormat(locale).format(result.products.length)} {locale==="fa"?"محصول":locale==="tr"?"ürün":locale==="ar"?"منتج":"products"}</p></div></div>{result.products.length?<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{result.products.map((product:any)=><ShopProductCard key={product.id} product={product}/>)}</div>:<div className="rounded-3xl border border-dashed bg-white p-12 text-center text-sm text-[#8b9098]">{locale==="fa"?"هنوز محصولی به این کالکشن اضافه نشده است.":locale==="tr"?"Bu koleksiyona henüz ürün eklenmedi.":locale==="ar"?"لم تتم إضافة منتجات إلى هذه المجموعة بعد.":"No products have been added to this collection yet."}</div>}</section></Container></main>;
}
