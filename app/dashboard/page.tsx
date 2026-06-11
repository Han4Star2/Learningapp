import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createSchoolYear, deleteSchoolYear } from "@/actions/school-years";
import { Button, Card, Input } from "@/components/ui";
import type { SchoolYear } from "@/types/domain";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: years } = await supabase
    .from("school_years")
    .select("*")
    .order("level", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });

  const schoolYears = (years ?? []) as SchoolYear[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">School Years</h1>
        <p className="text-sm text-gray-500">
          Organize your studies by grade or year.
        </p>
      </div>

      <Card>
        <form action={createSchoolYear} className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[180px]">
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Name
            </label>
            <Input name="name" placeholder="e.g. Grade 9" required />
          </div>
          <div className="w-24">
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Level
            </label>
            <Input name="level" type="number" placeholder="9" />
          </div>
          <Button type="submit">Add year</Button>
        </form>
      </Card>

      {schoolYears.length === 0 ? (
        <p className="text-sm text-gray-500">No school years yet. Add one above.</p>
      ) : (
        <ul className="space-y-2">
          {schoolYears.map((year) => (
            <li key={year.id}>
              <Card className="flex items-center justify-between">
                <Link
                  href={`/dashboard/years/${year.id}`}
                  className="font-medium hover:underline"
                >
                  {year.name}
                </Link>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/dashboard/years/${year.id}`}
                    className="text-sm text-gray-500 hover:underline"
                  >
                    View subjects →
                  </Link>
                  <form action={deleteSchoolYear}>
                    <input type="hidden" name="id" value={year.id} />
                    <Button variant="danger" type="submit">
                      Delete
                    </Button>
                  </form>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
