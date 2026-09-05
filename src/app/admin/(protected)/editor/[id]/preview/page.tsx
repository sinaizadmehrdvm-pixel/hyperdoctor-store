import Link from "next/link";
import { ArrowLeft, ExternalLink, Link2, ShieldCheck, XCircle } from "lucide-react";
import { adminRpc } from "@/lib/admin-data";
import type { BuilderBundle } from "@/lib/page-builder";
import { createBuilderPreview, revokeBuilderPreview } from "./actions";

type PreviewRow={id:string;expiresAt:string;createdAt:string;revokedAt?:string|null;active:boolean};

export default async function BuilderPreviewManager({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<{token?:string;expires?:string}>}){
  const {id}=await params;
  const {token="",expires=""}=await searchParams;
  const [bundle,rows]=await Promise.all([
    adminRpc<BuilderBundle|null>("admin_page_builder_get",{p_page_id:id}),
    adminRpc<PreviewRow[]>("admin_builder_preview_list",{p_page_id:id}),
  ]);
  if(!bundle)return null;
  const title=bundle.page.titleFa||bundle.page.titleEn||bundle.page.slug;
  const create=createBuilderPreview.bind(null,id);
  return <div className="mx-auto max-w-5xl space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><Link href={`/admin/editor/${id}`} className="mb-3 inline-flex items-center gap-2 text-xs font-black text-muted"><ArrowLeft className="h-4 w-4"/>Visual editor</Link><h1 className="text-2xl font-black text-foreground">Secure draft preview</h1><p className="mt-1 text-sm text-muted">{title} · /{bundle.page.slug}</p></div>
      <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700"><ShieldCheck className="h-4 w-4"/>Token-gated · draft only</div>
    </div>

    {token?<div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5"><div className="mb-3 font-black text-emerald-900">Preview link created</div><p className="mb-4 text-xs text-emerald-800">This token is shown only now. It expires {expires?new Date(expires).toLocaleString():"automatically"}.</p><div className="grid gap-2 sm:grid-cols-2">{(["fa","tr","en","ar"] as const).map(locale=><a key={locale} target="_blank" rel="noreferrer" href={`/preview/${token}/${locale}`} className="flex min-h-11 items-center justify-between rounded-xl bg-white px-4 text-xs font-black text-emerald-900 shadow-sm"><span>{locale.toUpperCase()} preview</span><ExternalLink className="h-4 w-4"/></a>)}</div></div>:null}

    <form action={create} className="rounded-2xl border border-border bg-card p-5"><div className="mb-4 flex items-center gap-2 font-black"><Link2 className="h-5 w-5"/>Create a new secure preview link</div><div className="flex flex-wrap gap-3"><select name="minutes" defaultValue="60" className="h-11 rounded-xl border border-border bg-background px-3 text-sm"><option value="15">15 minutes</option><option value="60">1 hour</option><option value="1440">24 hours</option><option value="10080">7 days</option></select><button className="h-11 rounded-xl bg-primary px-5 text-xs font-black text-white">Create preview</button></div><p className="mt-3 text-xs text-muted">The link reads the latest saved draft and never publishes it.</p></form>

    <div className="rounded-2xl border border-border bg-card"><div className="border-b border-border p-4 text-sm font-black">Preview history</div>{rows.length?<div className="divide-y divide-border">{rows.map(row=><div key={row.id} className="flex flex-wrap items-center gap-3 p-4"><div className="min-w-0 flex-1"><div className="text-sm font-bold">{row.active?"Active":"Expired / revoked"}</div><div className="mt-1 text-xs text-muted">Created {new Date(row.createdAt).toLocaleString()} · Expires {new Date(row.expiresAt).toLocaleString()}</div></div>{row.active?<form action={revokeBuilderPreview.bind(null,id,row.id)}><button className="flex h-9 items-center gap-2 rounded-lg bg-rose-50 px-3 text-xs font-black text-rose-700"><XCircle className="h-4 w-4"/>Revoke</button></form>:null}</div>)}</div>:<div className="p-8 text-center text-sm text-muted">No preview links yet.</div>}</div>
  </div>;
}
