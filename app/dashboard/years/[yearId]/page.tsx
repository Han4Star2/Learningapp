import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { buttonClass, Card } from "@/components/ui";
import { DeleteButton } from "@/components/delete-button";
import { deleteSubject } from "@/actions/subjects";
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

  const { data, error } = await supabase
    .from("subjects")
    .select("*")
    .eq("school_year_id", yearId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  const subjects = (data ?? []) as Subject[];

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard" className="text-sm text-gray-500 hover:underline">
          ← School years
        </Link>
        <div className="mt-1 flex items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold">{schoolYear.name}</h1>
          <div className="flex items-center gap-1">
            <Link
              href={`/dashboard/years/${yearId}/edit`}
              className={buttonClass("ghost")}
            >
              Edit year
            </Link>
            <Link
              href={`/dashboard/years/${yearId}/subjects/new`}
              className={buttonClass("primary")}
            >
              + New subject
            </Link>
          </div>
        </div>
      </div>

      {subjects.length === 0 ? (
        <Card>
          <p className="text-sm text-gray-500">
            No subjects yet. Add your first subject to this year.
          </p>
        </Card>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {subjects.map((subject) => (
            <li key={subject.id}>
              <Card className="flex items-center justify-between">
                <span className="font-medium">{subject.name}</span>
                <div className="flex items-center gap-1">
                  <Link
                    href={`/dashboard/years/${yearId}/subjects/${subject.id}/edit`}
                    className={buttonClass("ghost")}
                  >
                    Edit
                  </Link>
                  <DeleteButton
                    action={deleteSubject}
                    fields={{ id: subject.id, school_year_id: yearId }}
                  />
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
