import { notFound } from "next/navigation";
import { adminRpc } from "@/lib/admin-data";
import { currentAdminLocale } from "@/lib/admin-locale-server";
import type { BuilderBundle } from "@/lib/page-builder";
import { VisualPageEditor } from "@/components/admin/visual-page-editor";

export default async function VisualEditorPage({params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  const [bundle,adminLocale]=await Promise.all([
    adminRpc<BuilderBundle|null>("admin_page_builder_get",{p_page_id:id}),
    currentAdminLocale(),
  ]);
  if(!bundle) notFound();
  return <VisualPageEditor initial={bundle} adminLocale={adminLocale}/>;
}
