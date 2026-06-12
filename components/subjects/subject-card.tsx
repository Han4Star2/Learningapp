import Link from "next/link";
import { FileText, Sparkles, Pencil, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
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
    <Card className="group relative transition-shadow hover:shadow-md">
      <div className="absolute right-3 top-3 z-10 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
        <SubjectDialog
          subject={subject}
          trigger={
            <Button variant="ghost" size="icon" className="size-8" aria-label="Edit subject">
              <Pencil />
            </Button>
          }
        />
        <ConfirmDialog
          title="Delete subject"
          description="This permanently deletes the subject and all of its documents and generated content."
          onConfirm={() => deleteSubject(subject.id)}
          trigger={
            <Button variant="ghost" size="icon" className="size-8 text-destructive" aria-label="Delete subject">
              <Trash2 />
            </Button>
          }
        />
      </div>

      <Link href={`/subjects/${subject.id}`} className="block p-5">
        <span className={cn("inline-block size-3 rounded-full", color.dot)} />
        <h3 className="mt-3 truncate text-lg font-semibold">{subject.name}</h3>
        <div className="mt-4 flex gap-4 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <FileText className="size-4" />
            {documentCount} {documentCount === 1 ? "document" : "documents"}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Sparkles className="size-4" />
            {generatedCount} generated
          </span>
        </div>
      </Link>
    </Card>
  );
}
