import "server-only";

import { cookies } from "next/headers";
import { supabaseRpc } from "@/lib/supabase-rest";

export type StoreInventorySnapshot={
  branchId:string;
  branchCode:string;
  currency:string;
  countryCode:string;
  products:Array<{productId:string;available:number}>;
  variants:Array<{variantId:string;productId:string;available:number}>;
};

function safeBranchId(value:string|undefined|null){const v=value?.trim()||"";return v&&v.length<=160?v:null}

export async function getStoreInventory(explicitBranchId?:string|null):Promise<StoreInventorySnapshot|null>{
  try{
    const selected=safeBranchId(explicitBranchId)??safeBranchId((await cookies()).get("hd_branch")?.value);
    return await supabaseRpc<StoreInventorySnapshot|null>("public_store_inventory",{p_branch_id:selected});
  }catch(error){console.error("[store-inventory] snapshot failed",error);return null}
}

export function applyProductInventory<T extends {id:string;stock?:number|null}>(products:T[],snapshot:StoreInventorySnapshot|null){
  if(!snapshot)return products;
  const byId=new Map(snapshot.products.map(row=>[row.productId,Math.max(0,Math.floor(Number(row.available)||0))]));
  return products.map(product=>({...product,stock:byId.get(product.id)??0,storeBranchId:snapshot.branchId,storeCurrency:snapshot.currency}));
}

export function applyVariantInventory<T extends {id:string;stock?:number|null}>(variants:T[],snapshot:StoreInventorySnapshot|null){
  if(!snapshot)return variants;
  const byId=new Map(snapshot.variants.map(row=>[row.variantId,Math.max(0,Math.floor(Number(row.available)||0))]));
  return variants.map(variant=>({...variant,stock:byId.get(variant.id)??0,storeBranchId:snapshot.branchId,storeCurrency:snapshot.currency}));
}
