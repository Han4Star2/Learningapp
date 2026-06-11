import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createSubject, deleteSubject } from "@/actions/subjects";
import { Button, Card, Input } from "@/components/ui";
import type { SchoolYear, Subject } from "@/types/domain";

export default async function YearPage({
  params,
}: {
  params: Promise<{ yearId: string }>;
}) {
  const { yearId } = await params;
  const supabase = await createClient();

  const { data: year } = await supabase
    .from("school_years")
    .select("*")
    .eq("id", yearId)
    .single();

  if (!year) notFound();
  const schoolYear = year as SchoolYear;

  const { data: subjectRows } = await supabase
    .from("subjects")
    .select("*")
    .eq("school_year_id", yearId)
    .order("created_at", { ascending: true });

  const subjects = (subjectRows ?? []) as Subject[];

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard" className="text-sm text-gray-500 hover:underline">
          ← School years
        </Link>
        <h1 className="mt-1 text-2xl font-semibold">{schoolYear.name}</h1>
        <p className="text-sm text-gray-500">Subjects in this year.</p>
      </div>

      <Card>
        <form action={createSubject} className="flex flex-wrap items-end gap-3">
          <input type="hidden" name="school_year_id" value={schoolYear.id} />
          <div className="flex-1 min-w-[180px]">
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Subject name
            </label>
            <Input name="name" placeholder="e.g. Mathematics" required />
          </div>
          <div className="w-28">
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Color
            </label>
            <Input name="color" type="color" defaultValue="#1f2937" className="h-9 p-1" />
          </div>
          <Button type="submit">Add subject</Button>
        </form>
      </Card>

      {subjects.length === 0 ? (
        <p className="text-sm text-gray-500">No subjects yet. Add one above.</p>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2">
          {subjects.map((subject) => (
            <li key={subject.id}>
              <Card className="flex items-center justify-between">
                <span className="flex items-center gap-2 font-medium">
                  <span
                    className="inline-block h-3 w-3 rounded-full"
                    style={{ backgroundColor: subject.color ?? "#1f2937" }}
                  />
                  {subject.name}
                </span>
                <form action={deleteSubject}>
                  <input type="hidden" name="id" value={subject.id} />
                  <input type="hidden" name="school_year_id" value={schoolYear.id} />
                  <Button variant="danger" type="submit">
                    Delete
                  </Button>
                </form>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
