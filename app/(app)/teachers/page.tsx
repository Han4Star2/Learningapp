import { Plus, Pencil, Trash2, GraduationCap, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TeacherDialog } from "@/components/teachers/teacher-dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { deleteTeacher } from "@/actions/teachers";
import type { Teacher } from "@/types/domain";

export default async function TeachersPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("teachers")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  const teachers = (data ?? []) as Teacher[];

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Teachers</h1>
          <p className="mt-1 text-muted-foreground">
            Teachers are global and reusable across every subject. Tag their past
            exams and the AI imitates their style — phrasing, structure, marks.
          </p>
        </div>
        <TeacherDialog
          trigger={
            <Button>
              <Plus />
              New teacher
            </Button>
          }
        />
      </div>

      {teachers.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-3 p-12 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted">
            <Users className="size-6 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium">No teachers yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Add a teacher, then tag their past exams when uploading documents.
            </p>
          </div>
          <TeacherDialog
            trigger={
              <Button>
                <Plus />
                Create teacher
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teachers.map((teacher, idx) => (
            <div key={teacher.id} style={{ animation: `slide-up 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards`, animationDelay: `${idx * 75}ms`, opacity: 0 }}>
              <Card className="flex items-center justify-between p-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted">
                  <GraduationCap className="size-4 text-muted-foreground" />
                </div>
                <span className="truncate font-medium">{teacher.name}</span>
              </div>
              <div className="flex shrink-0 gap-1">
                <TeacherDialog
                  teacher={teacher}
                  trigger={
                    <Button variant="ghost" size="icon" className="size-8" aria-label="Rename teacher">
                      <Pencil />
                    </Button>
                  }
                />
                <ConfirmDialog
                  title="Delete teacher"
                  description="This removes the teacher. Documents tagged with them keep their text but lose the style link."
                  onConfirm={() => deleteTeacher(teacher.id)}
                  trigger={
                    <Button variant="ghost" size="icon" className="size-8 text-destructive" aria-label="Delete teacher">
                      <Trash2 />
                    </Button>
                  }
                />
              </div>
            </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
