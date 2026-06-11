import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { buttonClass, Card } from "@/components/ui";
import { DeleteButton } from "@/components/delete-button";
import { deleteSchoolYear } from "@/actions/school-years";
import type { SchoolYear } from "@/types/domain";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("school_years")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  const years = (data ?? []) as SchoolYear[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">School Years</h1>
          <p className="text-sm text-gray-500">
            Organize your studies by grade or year.
          </p>
        </div>
        <Link href="/dashboard/years/new" className={buttonClass("primary")}>
          + New school year
        </Link>
      </div>

      {years.length === 0 ? (
        <Card>
          <p className="text-sm text-gray-500">
            No school years yet. Create your first one to get started.
          </p>
        </Card>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {years.map((year) => (
            <li key={year.id}>
              <Card className="flex items-center justify-between">
                <Link
                  href={`/dashboard/years/${year.id}`}
                  className="font-medium hover:underline"
                >
                  {year.name}
                </Link>
                <div className="flex items-center gap-1">
                  <Link
                    href={`/dashboard/years/${year.id}/edit`}
                    className={buttonClass("ghost")}
                  >
                    Edit
                  </Link>
                  <DeleteButton action={deleteSchoolYear} fields={{ id: year.id }} />
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
