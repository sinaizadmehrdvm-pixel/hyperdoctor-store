import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { MediaUploader } from "@/components/admin/media-uploader";
import { DeleteButton } from "@/components/admin/delete-button";
import { deleteMedia } from "./actions";

export default async function AdminMediaPage() {
  const media = await prisma.media.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">رسانه‌ها</h1>
        <MediaUploader />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
        {media.map((m) => (
          <div key={m.id} className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-card">
            <Image src={m.url} alt={m.altFa} fill className="object-cover" />
            <div className="absolute inset-x-0 bottom-0 flex justify-end bg-gradient-to-t from-black/50 to-transparent p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
              <DeleteButton action={deleteMedia.bind(null, m.id)} confirmMessage="این تصویر حذف شود؟" />
            </div>
          </div>
        ))}
        {media.length === 0 ? (
          <p className="col-span-full rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted">
            هنوز تصویری آپلود نشده است.
          </p>
        ) : null}
      </div>
    </div>
  );
}
