import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateSchoolYear } from "@/actions/school-years";
import { YearForm } from "@/components/year-form";
import { Card } from "@/components/ui";
import type { SchoolYear } from "@/types/domain";

export default async function EditYearPage({
  params,
}: {
  params: Promise<{ yearId: string }>;
}) {
  const { yearId } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("school_years")
    .select("*")
    .eq("id", yearId)
    .single();
  if (!data) notFound();
  const year = data as SchoolYear;

  return (
    <div className="mx-auto max-w-md space-y-4">
      <Link
        href={`/dashboard/years/${yearId}`}
        className="text-sm text-gray-500 hover:underline"
      >
        ← Back
      </Link>
      <h1 className="text-2xl font-semibold">Edit school year</h1>
      <Card>
        <YearForm
          action={updateSchoolYear}
          id={year.id}
          initialName={year.name}
          submitLabel="Save changes"
        />
      </Card>
    </div>
  );
}
