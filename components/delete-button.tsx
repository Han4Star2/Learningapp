"use client";

import { useFormStatus } from "react-dom";
import { Button } from "./ui";

function ConfirmSubmit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button
      variant="danger"
      type="submit"
      disabled={pending}
      onClick={(e) => {
        if (!window.confirm("Delete this item? This cannot be undone.")) {
          e.preventDefault();
        }
      }}
    >
      {pending ? "Deleting…" : label}
    </Button>
  );
}

/**
 * Renders a small form that posts to a delete Server Action. The action and
 * any identifying fields are passed in from the parent Server Component.
 */
export function DeleteButton({
  action,
  fields,
  label = "Delete",
}: {
  action: (formData: FormData) => void | Promise<void>;
  fields: Record<string, string>;
  label?: string;
}) {
  return (
    <form action={action}>
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <ConfirmSubmit label={label} />
    </form>
  );
}
