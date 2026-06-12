"use client";

import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { deleteDocument } from "@/actions/documents";

export function DeleteDocumentButton({
  docId,
  subjectId,
}: {
  docId: string;
  subjectId: string;
}) {
  const router = useRouter();

  async function handleDelete() {
    await deleteDocument(docId, subjectId);
    toast.success("Document deleted.");
    router.push(`/subjects/${subjectId}/documents`);
  }

  return (
    <ConfirmDialog
      title="Delete document"
      description="This permanently deletes the document and any attached file."
      onConfirm={handleDelete}
      trigger={
        <Button variant="outline" size="sm" className="text-destructive">
          <Trash2 className="size-4" />
          Delete
        </Button>
      }
    />
  );
}
