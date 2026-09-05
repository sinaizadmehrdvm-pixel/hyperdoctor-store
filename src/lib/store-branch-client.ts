"use client";

export const STORE_BRANCH_COOKIE="hd_branch";
export const STORE_BRANCH_EVENT="hyperdoctor:branch-changed";

export function safeStoreBranchId(value:unknown){
  const id=typeof value==="string"?value.trim():"";
  return id&&id.length<=160?id:"";
}

export function readStoreBranchCookie(){
  if(typeof document==="undefined")return"";
  const prefix=`${STORE_BRANCH_COOKIE}=`;
  const hit=document.cookie.split(";").map(x=>x.trim()).find(x=>x.startsWith(prefix));
  if(!hit)return"";
  try{return safeStoreBranchId(decodeURIComponent(hit.slice(prefix.length)));}catch{return"";}
}

export function writeStoreBranchCookie(value:string){
  if(typeof document==="undefined")return false;
  const id=safeStoreBranchId(value);if(!id)return false;
  const secure=globalThis.location?.protocol==="https:"?"; Secure":"";
  document.cookie=`${STORE_BRANCH_COOKIE}=${encodeURIComponent(id)}; Path=/; Max-Age=31536000; SameSite=Lax${secure}`;
  return true;
}

export function emitStoreBranchChanged(value:string){
  if(typeof window==="undefined")return;
  const id=safeStoreBranchId(value);if(!id)return;
  window.dispatchEvent(new CustomEvent<string>(STORE_BRANCH_EVENT,{detail:id}));
}
