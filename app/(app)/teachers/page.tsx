import { createClient } from "@/lib/supabase/server";
import { createTeacher, deleteTeacher } from "@/actions/teachers";
import { NameForm } from "@/components/name-form";
import { DeleteButton } from "@/components/delete-button";
import { Card } from "@/components/ui";
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Teachers</h1>
        <p className="text-sm text-gray-500">
          Tag uploaded exams with a teacher and the AI will imitate their exam
          style — phrasing, structure, mark distribution.
        </p>
      </div>

      <Card>
        <NameForm
          action={createTeacher}
          placeholder="e.g. Mr. Smith"
          submitLabel="Add teacher"
        />
      </Card>

      {teachers.length === 0 ? (
        <Card>
          <p className="text-sm text-gray-500">No teachers yet.</p>
        </Card>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {teachers.map((teacher) => (
            <li key={teacher.id}>
              <Card className="flex items-center justify-between">
                <span className="font-medium">{teacher.name}</span>
                <DeleteButton action={deleteTeacher} fields={{ id: teacher.id }} />
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
