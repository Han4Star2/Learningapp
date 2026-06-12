import Link from "next/link";
import { FileText, Sparkles, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SubjectDialog } from "@/components/subjects/subject-dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { deleteSubject } from "@/actions/subjects";
import { cn } from "@/lib/utils";
import { SUBJECT_COLOR_CLASSES } from "@/lib/subject-colors";
import type { Subject } from "@/types/domain";

export function SubjectCard({
  subject,
  documentCount,
  generatedCount,
}: {
  subject: Subject;
  documentCount: number;
  generatedCount: number;
}) {
  const color = SUBJECT_COLOR_CLASSES[subject.color];

  return (
    <div className="group relative rounded-xl border bg-card text-card-foreground shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      {/* Colour accent bar */}
      <div className={cn("absolute inset-x-0 top-0 h-0.5 rounded-t-xl", color.dot)} />

      {/* Action buttons — visible on hover */}
      <div className="absolute right-3 top-4 z-10 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
        <SubjectDialog
          subject={subject}
          trigger={
            <Button variant="ghost" size="icon" className="size-7 rounded-lg" aria-label="Edit subject">
              <Pencil className="size-3.5" />
            </Button>
          }
        />
        <ConfirmDialog
          title="Delete subject"
          description="This permanently deletes the subject and all of its documents and generated content."
          onConfirm={deleteSubject.bind(null, subject.id)}
          trigger={
            <Button variant="ghost" size="icon" className="size-7 rounded-lg text-destructive/70 hover:text-destructive" aria-label="Delete subject">
              <Trash2 className="size-3.5" />
            </Button>
          }
        />
      </div>

      <Link href={`/subjects/${subject.id}`} className="block p-5 pt-6">
        {/* Color dot + name */}
        <div className="flex items-center gap-2.5">
          <span className={cn("size-2.5 shrink-0 rounded-full", color.dot)} />
          <h3 className="truncate text-base font-semibold tracking-tight">
            {subject.name}
          </h3>
        </div>

        {/* Stats */}
        <div className="mt-4 flex gap-4">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <FileText className="size-3.5" />
            <span>{documentCount} {documentCount === 1 ? "doc" : "docs"}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Sparkles className="size-3.5" />
            <span>{generatedCount} generated</span>
          </div>
        </div>
      </Link>
    </div>
  );
}
