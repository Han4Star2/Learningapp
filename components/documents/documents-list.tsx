"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Paperclip, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { DocumentDialog } from "@/components/documents/document-dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { deleteDocument } from "@/actions/documents";
import {
  DOCUMENT_TYPES,
  type DocumentType,
  type StudyDocument,
  type Teacher,
} from "@/types/domain";

type Filter = DocumentType | "all";

export function DocumentsList({
  subjectId,
  documents,
  teachers,
}: {
  subjectId: string;
  documents: StudyDocument[];
  teachers: Teacher[];
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("all");

  const teacherName = (id: string | null) =>
    teachers.find((t) => t.id === id)?.name ?? null;

  const visible =
    filter === "all" ? documents : documents.filter((d) => d.type === filter);

  const filters: Filter[] = ["all", ...DOCUMENT_TYPES];
  const countFor = (f: Filter) =>
    f === "all" ? documents.length : documents.filter((d) => d.type === f).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-full border px-3 py-1 text-sm capitalize transition-colors",
              filter === f
                ? "border-primary bg-primary text-primary-foreground"
                : "border-input bg-background hover:bg-accent"
            )}
          >
            {f} ({countFor(f)})
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          {documents.length === 0
            ? "No documents yet. Add notes, worksheets, textbook extracts — and tag past exams with their teacher to capture exam style."
            : "No documents of this type."}
        </Card>
      ) : (
        <ul className="space-y-2">
          {visible.map((doc) => (
            <li key={doc.id}>
              <Card className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/subjects/${subjectId}/documents/${doc.id}`}
                    className="truncate font-medium hover:underline"
                  >
                    {doc.title}
                  </Link>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="secondary" className="capitalize">
                      {doc.type}
                    </Badge>
                    {teacherName(doc.teacher_id) && (
                      <Badge variant="outline">{teacherName(doc.teacher_id)}</Badge>
                    )}
                    {doc.storage_path && (
                      <span className="inline-flex items-center gap-1">
                        <Paperclip className="size-3" />
                        file
                      </span>
                    )}
                    <span>{(doc.content ?? "").length.toLocaleString()} chars</span>
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                  <DocumentDialog
                    subjectId={subjectId}
                    teachers={teachers}
                    document={doc}
                    trigger={
                      <Button variant="ghost" size="icon" className="size-8" aria-label="Edit document">
                        <Pencil />
                      </Button>
                    }
                  />
                  <ConfirmDialog
                    title="Delete document"
                    description="This permanently deletes the document and any attached file."
                    onConfirm={async () => {
                      await deleteDocument(doc.id, subjectId);
                      toast.success("Document deleted.");
                      router.refresh();
                    }}
                    trigger={
                      <Button variant="ghost" size="icon" className="size-8 text-destructive" aria-label="Delete document">
                        <Trash2 />
                      </Button>
                    }
                  />
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
