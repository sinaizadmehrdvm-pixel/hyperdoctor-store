import "server-only";

import { cookies } from "next/headers";
import { supabaseRpc } from "@/lib/supabase-rest";

type ProductPrice={productId:string;price:number;compareAtPrice?:number|null};
type VariantPrice={variantId:string;productId:string;price:number;compareAtPrice?:number|null};
type StoreCommerceSnapshot={branchId:string;branchCode:string;currency:string;countryCode:string;salesEnabled:boolean;paymentGateway:string;productPrices:ProductPrice[];variantPrices:VariantPrice[]};
export type StoreInventorySnapshot={
  branchId:string;
  branchCode:string;
  currency:string;
  countryCode:string;
  salesEnabled?:boolean;
  paymentGateway?:string;
  products:Array<{productId:string;available:number}>;
  variants:Array<{variantId:string;productId:string;available:number}>;
  productPrices:ProductPrice[];
  variantPrices:VariantPrice[];
};

function safeBranchId(value:string|undefined|null){const v=value?.trim()||"";return v&&v.length<=160?v:null}

export async function getStoreInventory(explicitBranchId?:string|null):Promise<StoreInventorySnapshot|null>{
  try{
    const selected=safeBranchId(explicitBranchId)??safeBranchId((await cookies()).get("hd_branch")?.value);
    const[inventory,commerce]=await Promise.all([
      supabaseRpc<Omit<StoreInventorySnapshot,"productPrices"|"variantPrices"|"salesEnabled"|"paymentGateway">|null>("public_store_inventory",{p_branch_id:selected}),
      supabaseRpc<StoreCommerceSnapshot|null>("public_store_commerce",{p_branch_id:selected}).catch(()=>null),
    ]);
    if(!inventory)return null;
    return{...inventory,salesEnabled:commerce?.branchId===inventory.branchId?commerce.salesEnabled:false,paymentGateway:commerce?.branchId===inventory.branchId?commerce.paymentGateway:"DISABLED",productPrices:commerce?.branchId===inventory.branchId?commerce.productPrices??[]:[],variantPrices:commerce?.branchId===inventory.branchId?commerce.variantPrices??[]:[]};
  }catch(error){console.error("[store-inventory] snapshot failed",error);return null}
}

export function applyProductInventory<T extends {id:string;stock?:number|null;price?:number|null;compareAtPrice?:number|null}>(products:T[],snapshot:StoreInventorySnapshot|null){
  if(!snapshot)return products;
  const stockById=new Map(snapshot.products.map(row=>[row.productId,Math.max(0,Math.floor(Number(row.available)||0))]));
  const priceById=new Map(snapshot.productPrices.map(row=>[row.productId,row]));
  return products.map(product=>{const override=priceById.get(product.id);return{...product,stock:stockById.get(product.id)??0,price:override?.price??product.price,compareAtPrice:override?override.compareAtPrice??null:product.compareAtPrice,storeBranchId:snapshot.branchId,storeCurrency:snapshot.currency,storeSalesEnabled:snapshot.salesEnabled===true,storePaymentGateway:snapshot.paymentGateway??"DISABLED"}});
}

export function applyVariantInventory<T extends {id:string;productId?:string;stock?:number|null;price?:number|null;compareAtPrice?:number|null}>(variants:T[],snapshot:StoreInventorySnapshot|null){
  if(!snapshot)return variants;
  const stockById=new Map(snapshot.variants.map(row=>[row.variantId,Math.max(0,Math.floor(Number(row.available)||0))]));
  const variantPriceById=new Map(snapshot.variantPrices.map(row=>[row.variantId,row]));
  const productPriceById=new Map(snapshot.productPrices.map(row=>[row.productId,row]));
  return variants.map(variant=>{const override=variantPriceById.get(variant.id)??(variant.productId?productPriceById.get(variant.productId):undefined);return{...variant,stock:stockById.get(variant.id)??0,price:override?.price??variant.price,compareAtPrice:override?override.compareAtPrice??null:variant.compareAtPrice,storeBranchId:snapshot.branchId,storeCurrency:snapshot.currency,storeSalesEnabled:snapshot.salesEnabled===true,storePaymentGateway:snapshot.paymentGateway??"DISABLED"}});
}
