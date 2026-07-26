"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Loader2, Upload, X } from "lucide-react";

export function ImageUploadField({
  name,
  label,
  defaultValue,
}: {
  name: string;
  label: string;
  defaultValue?: string | null;
}) {
  const [url, setUrl] = useState(defaultValue ?? "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const response = await fetch("/api/admin/upload", { method: "POST", body: form });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Upload failed");
      setUrl(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-muted">{label}</span>
      <input type="hidden" name={name} value={url} />
      <div className="flex items-center gap-4">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-border bg-muted-bg">
          {url ? (
            <Image src={url} alt="" fill className="object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-muted">
              <Upload className="h-5 w-5" aria-hidden="true" />
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex min-h-9 items-center gap-2 rounded-lg border border-border px-3 text-xs font-medium text-foreground hover:bg-muted-bg cursor-pointer disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <Upload className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            {uploading ? "در حال آپلود..." : "انتخاب تصویر"}
          </button>
          {url ? (
            <button
              type="button"
              onClick={() => setUrl("")}
              className="flex min-h-9 items-center gap-2 text-xs font-medium text-accent hover:underline cursor-pointer"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
              حذف تصویر
            </button>
          ) : null}
          {error ? <p className="text-xs text-accent">{error}</p> : null}
        </div>
      </div>
    </div>
  );
}
