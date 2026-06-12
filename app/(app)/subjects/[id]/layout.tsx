import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { SubjectDialog } from "@/components/subjects/subject-dialog";
import { DeleteSubjectButton } from "@/components/subjects/delete-subject-button";
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
  const { data } = await supabase.from("subjects").select("*").eq("id", id).single();
  if (!data) notFound();
  const subject = data as Subject;
  const color = SUBJECT_COLOR_CLASSES[subject.color];

  return (
    <div className="space-y-6">
      {/* Subject header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg", color.soft)}>
            <span className={cn("size-3 rounded-full", color.dot)} />
          </div>
          <h1 className="truncate text-xl font-bold tracking-tight">
            {subject.name}
          </h1>
        </div>
        <div className="flex shrink-0 gap-1">
          <SubjectDialog
            subject={subject}
            trigger={
              <Button variant="ghost" size="icon" className="size-8 rounded-lg" aria-label="Edit subject">
                <Pencil className="size-4" />
              </Button>
            }
          />
          <DeleteSubjectButton subjectId={subject.id} />
        </div>
      </div>

      <SubjectTabs subjectId={subject.id} />

      <div className="animate-slide-up">
        {children}
      </div>
    </div>
  );
}
