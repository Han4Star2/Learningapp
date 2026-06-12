import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { ExamUploadDialog } from "@/components/exams/exam-upload-dialog";
import { ExamsList } from "@/components/exams/exams-list";
import type { Exam, Teacher } from "@/types/domain";

export default async function ExamsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: examRows, error }, { data: teacherRows }] = await Promise.all([
    supabase
      .from("exams")
      .select("*")
      .eq("subject_id", id)
      .order("date_of_exam", { ascending: false, nullsFirst: false }),
    supabase.from("teachers").select("*").order("created_at"),
  ]);
  if (error) throw new Error(error.message);

  const exams = (examRows ?? []) as Exam[];
  const teachers = (teacherRows ?? []) as Teacher[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Exams</h2>
          <p className="text-sm text-muted-foreground">
            Upload past exam papers. Tag a teacher to capture their style.
          </p>
        </div>
        <ExamUploadDialog
          subjectId={id}
          teachers={teachers}
          trigger={
            <Button>
              <Plus />
              Upload exam
            </Button>
          }
        />
      </div>

      <ExamsList subjectId={id} exams={exams} teachers={teachers} />
    </div>
  );
}
