import { notFound } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { deleteSubject } from "@/actions/subjects";
import { Button } from "@/components/ui/button";
import { SubjectDialog } from "@/components/subjects/subject-dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { SubjectTabs } from "@/components/shell/subject-tabs";
import { cn } from "@/lib/utils";
import { SUBJECT_COLOR_CLASSES } from "@/lib/subject-colors";
import type { Subject } from "@/types/domain";

export default async function SubjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("subjects")
    .select("*")
    .eq("id", id)
    .single();
  if (!data) notFound();
  const subject = data as Subject;
  const color = SUBJECT_COLOR_CLASSES[subject.color];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className={cn("size-4 shrink-0 rounded-full", color.dot)} />
          <h1 className="truncate text-2xl font-bold tracking-tight">
            {subject.name}
          </h1>
        </div>
        <div className="flex shrink-0 gap-1">
          <SubjectDialog
            subject={subject}
            trigger={
              <Button variant="ghost" size="icon" aria-label="Edit subject">
                <Pencil />
              </Button>
            }
          />
          <ConfirmDialog
            title="Delete subject"
            description="This permanently deletes the subject and all of its documents and generated content."
            onConfirm={() => deleteSubject(subject.id)}
            trigger={
              <Button variant="ghost" size="icon" className="text-destructive" aria-label="Delete subject">
                <Trash2 />
              </Button>
            }
          />
        </div>
      </div>
      <SubjectTabs subjectId={subject.id} />
      {children}
    </div>
  );
}
