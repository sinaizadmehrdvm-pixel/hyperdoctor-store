"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { GripVertical, ImagePlus, Loader2, Trash2, Upload } from "lucide-react";

export function MultiImageUploadField({
  name,
  label,
  defaultValues = [],
  maxImages = 8,
}: {
  name: string;
  label: string;
  defaultValues?: string[];
  maxImages?: number;
}) {
  const [urls, setUrls] = useState(defaultValues.filter(Boolean));
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function uploadFiles(files: FileList | File[]) {
    const incoming = Array.from(files).slice(0, Math.max(0, maxImages - urls.length));
    if (!incoming.length) return;

    setUploading(true);
    setError(null);
    try {
      const uploaded: string[] = [];
      for (const file of incoming) {
        const form = new FormData();
        form.append("file", file);
        const response = await fetch("/api/admin/upload", { method: "POST", body: form });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Upload failed");
        uploaded.push(data.url);
      }
      setUrls((current) => [...current, ...uploaded].slice(0, maxImages));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function move(index: number, direction: -1 | 1) {
    setUrls((current) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= current.length) return current;
      const next = [...current];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next;
    });
  }

  return (
    <fieldset className="rounded-2xl border border-border bg-white p-4 sm:p-5">
      <legend className="px-2 text-xs font-bold text-muted">{label}</legend>
      <input type="hidden" name={name} value={JSON.stringify(urls)} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {urls.map((url, index) => (
          <div key={`${url}-${index}`} className="group relative overflow-hidden rounded-xl border border-border bg-muted-bg">
            <div className="relative aspect-square">
              <Image src={url} alt="" fill className="object-contain p-2" sizes="160px" />
            </div>
            <div className="absolute inset-x-1 bottom-1 flex items-center justify-between gap-1 rounded-lg bg-navy/85 p-1 text-white opacity-100 backdrop-blur sm:opacity-0 sm:transition sm:group-hover:opacity-100">
              <button type="button" onClick={() => move(index, -1)} disabled={index === 0} className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-white/10 disabled:opacity-30" aria-label="Move image earlier">
                <GripVertical className="h-4 w-4 rotate-90" aria-hidden="true" />
              </button>
              <span className="text-[10px] font-bold tabular-nums">{index + 1}</span>
              <button type="button" onClick={() => move(index, 1)} disabled={index === urls.length - 1} className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-white/10 disabled:opacity-30" aria-label="Move image later">
                <GripVertical className="h-4 w-4 -rotate-90" aria-hidden="true" />
              </button>
              <button type="button" onClick={() => setUrls((current) => current.filter((_, i) => i !== index))} className="flex h-8 w-8 items-center justify-center rounded-md text-red-200 hover:bg-red-500/20" aria-label="Remove image">
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        ))}

        {urls.length < maxImages ? (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="vitalis-focus flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted-bg px-3 text-center text-xs font-bold text-muted transition hover:border-primary/40 hover:text-primary disabled:opacity-50"
          >
            {uploading ? <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" /> : <ImagePlus className="h-6 w-6" aria-hidden="true" />}
            {uploading ? "در حال آپلود..." : "افزودن تصویر"}
          </button>
        ) : null}
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        className="hidden"
        onChange={(event) => event.target.files && uploadFiles(event.target.files)}
      />

      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted">
        <span className="inline-flex items-center gap-1"><Upload className="h-3.5 w-3.5" aria-hidden="true" /> حداکثر {maxImages} تصویر</span>
        <span>تصویر شماره ۱، تصویر اصلی محصول است.</span>
      </div>
      {error ? <p className="mt-2 text-xs font-medium text-accent">{error}</p> : null}
    </fieldset>
  );
}
