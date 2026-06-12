"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, FileText, CalendarDays, GraduationCap } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { deleteExam } from "@/actions/exams";
import type { Exam, Teacher } from "@/types/domain";

export function ExamsList({
  subjectId,
  exams,
  teachers,
}: {
  subjectId: string;
  exams: Exam[];
  teachers: Teacher[];
}) {
  const router = useRouter();
  const teacherMap = Object.fromEntries(teachers.map((t) => [t.id, t.name]));

  if (exams.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No exams yet — upload a past exam to get started.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {exams.map((exam) => (
        <ExamRow
          key={exam.id}
          exam={exam}
          subjectId={subjectId}
          teacherName={exam.teacher_id ? (teacherMap[exam.teacher_id] ?? null) : null}
          onDeleted={() => router.refresh()}
        />
      ))}
    </ul>
  );
}

function ExamRow({
  exam,
  subjectId,
  teacherName,
  onDeleted,
}: {
  exam: Exam;
  subjectId: string;
  teacherName: string | null;
  onDeleted: () => void;
}) {
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      await deleteExam(exam.id, subjectId);
      toast.success("Exam deleted.");
      onDeleted();
    });
  }

  return (
    <li className="group relative">
      <Card>
        <CardContent className="flex items-start gap-4 p-4">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400">
            <FileText className="size-4" />
          </div>

          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              {exam.date_of_exam && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <CalendarDays className="size-3" />
                  {new Date(exam.date_of_exam).toLocaleDateString()}
                </div>
              )}
              {teacherName && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <GraduationCap className="size-3" />
                  {teacherName}
                </div>
              )}
              {exam.file_url && (
                <Badge variant="secondary" className="text-[10px]">File attached</Badge>
              )}
            </div>
            {exam.extracted_text && (
              <p className="line-clamp-2 text-xs text-muted-foreground">
                {exam.extracted_text}
              </p>
            )}
            <p className="text-[11px] text-muted-foreground/60">
              Added {new Date(exam.created_at).toLocaleDateString()}
            </p>
          </div>

          <ConfirmDialog
            title="Delete exam"
            description="This permanently removes the exam and its file."
            onConfirm={handleDelete}
            trigger={
              <Button
                variant="ghost"
                size="icon"
                className="size-8 shrink-0 text-destructive/60 opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
                disabled={pending}
                aria-label="Delete exam"
                onClick={(e) => e.preventDefault()}
              >
                <Trash2 className="size-4" />
              </Button>
            }
          />
        </CardContent>
      </Card>
    </li>
  );
}
