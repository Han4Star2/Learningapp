"use client";

import { useActionState } from "react";
import { Button, Input } from "./ui";
import type { FormState } from "@/types/domain";

/** Create or edit a school year. Reused by the `new` and `edit` routes. */
export function YearForm({
  action,
  id,
  initialName = "",
  submitLabel,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  id?: string;
  initialName?: string;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    action,
    undefined
  );

  return (
    <form action={formAction} className="space-y-3">
      {id && <input type="hidden" name="id" value={id} />}
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-600">
          Name
        </label>
        <Input
          name="name"
          defaultValue={initialName}
          placeholder="e.g. Grade 9"
          required
          autoFocus
        />
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}
