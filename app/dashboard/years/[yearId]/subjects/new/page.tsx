import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createSubject } from "@/actions/subjects";
import { SubjectForm } from "@/components/subject-form";
import { Card } from "@/components/ui";
import type { SchoolYear } from "@/types/domain";

export default async function NewSubjectPage({
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

  return (
    <div className="mx-auto max-w-md space-y-4">
      <Link
        href={`/dashboard/years/${yearId}`}
        className="text-sm text-gray-500 hover:underline"
      >
        ← Back
      </Link>
      <h1 className="text-2xl font-semibold">New subject</h1>
      <p className="text-sm text-gray-500">in {schoolYear.name}</p>
      <Card>
        <SubjectForm
          action={createSubject}
          schoolYearId={yearId}
          submitLabel="Create"
        />
      </Card>
    </div>
  );
}
