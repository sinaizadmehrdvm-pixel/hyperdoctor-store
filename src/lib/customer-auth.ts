import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { supabaseRpc } from "@/lib/supabase-rest";

const COOKIE="hd_customer_session";
const MAX_AGE=60*60*24*30;

export type CustomerIdentity={id:string;email?:string|null;phone?:string|null;fullName:string;locale:string;marketingConsent?:boolean;expiresAt?:string};
type LoginResult=CustomerIdentity&{token:string};

export async function registerCustomer(input:{email?:string;phone?:string;password:string;fullName:string;locale:string}){
  const result=await supabaseRpc<LoginResult>("customer_register",{p_email:input.email??"",p_phone:input.phone??"",p_password:input.password,p_full_name:input.fullName,p_locale:input.locale});
  await setCustomerCookie(result.token); const {token:_,...identity}=result; return identity;
}

export async function loginCustomer(identifier:string,password:string){
  const result=await supabaseRpc<LoginResult|null>("customer_login",{p_identifier:identifier,p_password:password});
  if(!result?.token) return null; await setCustomerCookie(result.token); const {token:_,...identity}=result; return identity;
}

async function setCustomerCookie(token:string){const store=await cookies();store.set(COOKIE,token,{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",maxAge:MAX_AGE});}
export async function getCustomerToken(){const store=await cookies();return store.get(COOKIE)?.value??null;}
export async function getCustomerSession():Promise<CustomerIdentity|null>{const token=await getCustomerToken();if(!token)return null;try{return await supabaseRpc<CustomerIdentity|null>("customer_validate_session",{p_token:token});}catch{return null;}}
export async function requireCustomerSession(locale:string){const s=await getCustomerSession();if(!s)redirect(`/${locale}/account/login`);return s;}
export async function logoutCustomer(){const store=await cookies();const token=store.get(COOKIE)?.value;if(token)await supabaseRpc<boolean>("customer_logout",{p_token:token}).catch(()=>false);store.delete(COOKIE);}
export async function customerRpc<T>(fn:string,payload:Record<string,unknown>={}){const token=await getCustomerToken();if(!token)throw new Error("customer_session_required");return supabaseRpc<T>(fn,{p_token:token,...payload});}
