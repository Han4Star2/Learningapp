import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createSubject, deleteSubject } from "@/actions/subjects";
import { NameForm } from "@/components/name-form";
import { DeleteButton } from "@/components/delete-button";
import { Card } from "@/components/ui";
import type { Subject } from "@/types/domain";

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("subjects")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  const subjects = (data ?? []) as Subject[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Subjects</h1>
        <p className="text-sm text-gray-500">
          Each subject holds your documents and powers AI exams, quizzes and
          flashcards.
        </p>
      </div>

      <Card>
        <NameForm
          action={createSubject}
          placeholder="e.g. Mathematics"
          submitLabel="Add subject"
        />
      </Card>

      {subjects.length === 0 ? (
        <Card>
          <p className="text-sm text-gray-500">
            No subjects yet. Create your first one above, then add notes and
            past exams to start generating.
          </p>
        </Card>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {subjects.map((subject) => (
            <li key={subject.id}>
              <Card className="flex items-center justify-between">
                <Link
                  href={`/subjects/${subject.id}`}
                  className="font-medium hover:underline"
                >
                  {subject.name}
                </Link>
                <DeleteButton action={deleteSubject} fields={{ id: subject.id }} />
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
