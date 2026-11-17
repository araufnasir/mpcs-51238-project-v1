"use client";

import { deleteDecision } from "./actions";
import { btn } from "@/lib/ui";

export function DeleteButton({ id, title }: { id: string; title: string }) {
  return (
    <form
      action={deleteDecision}
      onSubmit={(e) => {
        if (!confirm(`Delete "${title}"? This can't be undone.`)) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button className={btn.danger} aria-label={`Delete ${title}`}>
        Delete
      </button>
    </form>
  );
}
