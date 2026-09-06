import Link from "next/link";
import { Blocks, Eye, Library, ShieldCheck } from "lucide-react";

export default async function EditorToolsLayout({children,params}:{children:React.ReactNode;params:Promise<{id:string}>}){
 const {id}=await params;
 return <>{children}<nav className="fixed bottom-4 left-1/2 z-[110] flex -translate-x-1/2 items-center gap-1 rounded-2xl border border-slate-200 bg-white/95 p-1.5 shadow-[0_14px_50px_rgba(0,23,54,.22)] backdrop-blur" aria-label="Visual editor tools">
  <Link href={`/admin/editor/${id}/sections`} title="Reusable blocks" className="flex h-10 items-center gap-2 rounded-xl px-3 text-xs font-black text-violet-700 hover:bg-violet-50"><Blocks className="h-4 w-4"/><span className="hidden md:inline">Blocks</span></Link>
  <Link href={`/admin/editor/${id}/quality`} title="Quality gate" className="flex h-10 items-center gap-2 rounded-xl px-3 text-xs font-black text-emerald-700 hover:bg-emerald-50"><ShieldCheck className="h-4 w-4"/><span className="hidden md:inline">Quality</span></Link>
  <Link href={`/admin/editor/${id}/preview`} title="Secure preview" className="flex h-10 items-center gap-2 rounded-xl px-3 text-xs font-black text-amber-700 hover:bg-amber-50"><Eye className="h-4 w-4"/><span className="hidden md:inline">Preview</span></Link>
  <Link href={`/admin/editor/${id}/templates`} title="Page templates" className="flex h-10 items-center gap-2 rounded-xl px-3 text-xs font-black text-sky-700 hover:bg-sky-50"><Library className="h-4 w-4"/><span className="hidden md:inline">Templates</span></Link>
 </nav></>;
}
