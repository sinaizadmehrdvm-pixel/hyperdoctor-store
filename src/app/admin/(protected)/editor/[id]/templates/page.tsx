import Link from "next/link";
import { ArrowLeft, Layers3, Save, Trash2, WandSparkles } from "lucide-react";
import { adminRpc } from "@/lib/admin-data";
import type { BuilderBundle, BuilderDocument } from "@/lib/page-builder";
import { applyBuilderTemplate, deleteBuilderTemplate, saveCurrentDraftAsTemplate } from "./actions";

type TemplateRow={id:string;name:string;description:string;document:BuilderDocument;createdAt:string;updatedAt:string};

export default async function BuilderTemplateLibrary({params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  const [bundle,templates]=await Promise.all([
    adminRpc<BuilderBundle|null>("admin_page_builder_get",{p_page_id:id}),
    adminRpc<TemplateRow[]>("admin_builder_templates",{}),
  ]);
  if(!bundle)return null;
  const saveAction=saveCurrentDraftAsTemplate.bind(null,id);
  const title=bundle.page.titleFa||bundle.page.titleEn||bundle.page.slug;
  return <div className="mx-auto max-w-6xl space-y-6">
    <div><Link href={`/admin/editor/${id}`} className="mb-3 inline-flex items-center gap-2 text-xs font-black text-muted"><ArrowLeft className="h-4 w-4"/>Visual editor</Link><h1 className="text-2xl font-black text-foreground">Reusable page templates</h1><p className="mt-1 text-sm text-muted">Save the current draft of {title} and reuse it on any editable page.</p></div>

    <form action={saveAction} className="grid gap-3 rounded-2xl border border-border bg-card p-5 md:grid-cols-[1fr_1.6fr_auto]"><input required minLength={2} maxLength={120} name="name" placeholder="Template name" className="h-11 rounded-xl border border-border bg-background px-3 text-sm"/><input maxLength={500} name="description" placeholder="Short description (optional)" className="h-11 rounded-xl border border-border bg-background px-3 text-sm"/><button className="flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-xs font-black text-white"><Save className="h-4 w-4"/>Save current draft</button></form>

    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{templates.map(template=><article key={template.id} className="rounded-2xl border border-border bg-card p-5"><div className="mb-3 flex items-start gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700"><Layers3 className="h-5 w-5"/></div><div className="min-w-0 flex-1"><h2 className="truncate font-black text-foreground">{template.name}</h2><p className="mt-1 line-clamp-2 text-xs leading-5 text-muted">{template.description||`${template.document.sections.length} sections`}</p></div></div><div className="mb-4 flex gap-2 text-[10px] text-muted"><span>{template.document.sections.length} sections</span><span>·</span><span>{new Date(template.updatedAt).toLocaleString()}</span></div><div className="flex gap-2"><form action={applyBuilderTemplate.bind(null,id,template.id)} className="flex-1"><button className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-foreground px-3 text-xs font-black text-background"><WandSparkles className="h-4 w-4"/>Apply to draft</button></form><form action={deleteBuilderTemplate.bind(null,id,template.id)}><button title="Delete template" className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-700"><Trash2 className="h-4 w-4"/></button></form></div></article>)}{templates.length===0?<div className="col-span-full rounded-2xl border border-dashed border-border p-12 text-center text-sm text-muted">No reusable templates yet. Save the current draft to create the first one.</div>:null}</div>
  </div>;
}
