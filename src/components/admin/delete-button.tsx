"use client";

import { Trash2 } from "lucide-react";

export function DeleteButton({
  action,
  confirmMessage = "این مورد حذف شود؟",
  disabled = false,
  disabledReason,
}: {
  action: () => Promise<void>;
  confirmMessage?: string;
  disabled?: boolean;
  disabledReason?: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(confirmMessage)) e.preventDefault();
      }}
    >
      <button
        type="submit"
        aria-label="حذف"
        disabled={disabled}
        title={disabledReason}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-accent/10 hover:text-accent cursor-pointer disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-muted"
      >
        <Trash2 className="h-4 w-4" aria-hidden="true" />
      </button>
    </form>
  );
}
