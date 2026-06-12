"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { deleteSubject } from "@/actions/subjects";

export function DeleteSubjectButton({ subjectId }: { subjectId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      await deleteSubject(subjectId);
      router.push("/dashboard");
    });
  }

  return (
    <ConfirmDialog
      title="Delete subject"
      description="This permanently deletes the subject and all of its documents and generated content."
      onConfirm={handleDelete}
      trigger={
        <Button
          variant="ghost"
          size="icon"
          className="size-8 rounded-lg text-destructive/70 hover:text-destructive"
          aria-label="Delete subject"
          disabled={pending}
        >
          <Trash2 className="size-4" />
        </Button>
      }
    />
  );
}
