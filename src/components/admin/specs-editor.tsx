"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

type SpecRow = { key: string; fa: string; en: string };

function parseInitial(json: string): SpecRow[] {
  try {
    const parsed = JSON.parse(json) as Record<string, { fa: string; en: string }>;
    return Object.entries(parsed).map(([key, value]) => ({
      key,
      fa: value.fa ?? "",
      en: value.en ?? "",
    }));
  } catch {
    return [];
  }
}

export function SpecsEditor({ name, defaultValue }: { name: string; defaultValue?: string }) {
  const [rows, setRows] = useState<SpecRow[]>(() => parseInitial(defaultValue ?? "{}"));

  const serialized = JSON.stringify(
    Object.fromEntries(
      rows.filter((r) => r.key.trim()).map((r) => [r.key.trim(), { fa: r.fa, en: r.en }])
    )
  );

  return (
    <div className="flex flex-col gap-3">
      <span className="text-xs font-medium text-muted">مشخصات فنی</span>
      <input type="hidden" name={name} value={serialized} />

      <div className="space-y-2">
        {rows.map((row, i) => (
          <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2">
            <input
              placeholder="ویژگی (مثلاً وزن)"
              value={row.key}
              onChange={(e) =>
                setRows((prev) =>
                  prev.map((r, idx) => (idx === i ? { ...r, key: e.target.value } : r))
                )
              }
              className="h-10 rounded-lg border border-border bg-background px-2.5 text-xs"
            />
            <input
              placeholder="مقدار (فارسی)"
              value={row.fa}
              onChange={(e) =>
                setRows((prev) =>
                  prev.map((r, idx) => (idx === i ? { ...r, fa: e.target.value } : r))
                )
              }
              className="h-10 rounded-lg border border-border bg-background px-2.5 text-xs"
            />
            <input
              placeholder="Value (English)"
              dir="ltr"
              value={row.en}
              onChange={(e) =>
                setRows((prev) =>
                  prev.map((r, idx) => (idx === i ? { ...r, en: e.target.value } : r))
                )
              }
              className="h-10 rounded-lg border border-border bg-background px-2.5 text-xs"
            />
            <button
              type="button"
              onClick={() => setRows((prev) => prev.filter((_, idx) => idx !== i))}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-muted hover:bg-accent/10 hover:text-accent cursor-pointer"
              aria-label="حذف"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setRows((prev) => [...prev, { key: "", fa: "", en: "" }])}
        className="flex w-fit min-h-9 items-center gap-1.5 rounded-lg border border-dashed border-border px-3 text-xs font-medium text-foreground hover:bg-muted-bg cursor-pointer"
      >
        <Plus className="h-3.5 w-3.5" aria-hidden="true" />
        افزودن مشخصه
      </button>
    </div>
  );
}
