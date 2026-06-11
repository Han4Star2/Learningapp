"use client";

import { useActionState } from "react";
import { Button, Input } from "./ui";
import type { FormState } from "@/types/domain";

/** Single-field create/rename form (subjects, teachers). */
export function NameForm({
  action,
  placeholder,
  submitLabel,
  id,
  initialName = "",
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  placeholder: string;
  submitLabel: string;
  id?: string;
  initialName?: string;
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    action,
    undefined
  );

  return (
    <form action={formAction} className="flex flex-wrap items-start gap-2">
      {id && <input type="hidden" name="id" value={id} />}
      <div className="flex-1 min-w-[200px]">
        <Input name="name" defaultValue={initialName} placeholder={placeholder} required />
        {state?.error && (
          <p className="mt-1 text-sm text-red-600">{state.error}</p>
        )}
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}
