import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateSubject } from "@/actions/subjects";
import { SubjectForm } from "@/components/subject-form";
import { Card } from "@/components/ui";
import type { Subject } from "@/types/domain";

export default async function EditSubjectPage({
  params,
}: {
  params: Promise<{ yearId: string; subjectId: string }>;
}) {
  const { yearId, subjectId } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("subjects")
    .select("*")
    .eq("id", subjectId)
    .single();
  if (!data) notFound();
  const subject = data as Subject;

  return (
    <div className="mx-auto max-w-md space-y-4">
      <Link
        href={`/dashboard/years/${yearId}`}
        className="text-sm text-gray-500 hover:underline"
      >
        ← Back
      </Link>
      <h1 className="text-2xl font-semibold">Edit subject</h1>
      <Card>
        <SubjectForm
          action={updateSubject}
          schoolYearId={yearId}
          id={subject.id}
          initialName={subject.name}
          submitLabel="Save changes"
        />
      </Card>
    </div>
  );
}
