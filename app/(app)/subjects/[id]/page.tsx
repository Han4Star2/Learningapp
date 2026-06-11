import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { buttonClass, Card } from "@/components/ui";
import { DOCUMENT_TYPES, type StudyDocument, type Teacher } from "@/types/domain";

export default async function SubjectHubPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: docRows }, { data: teacherRows }] = await Promise.all([
    supabase.from("documents").select("id, type, teacher_id").eq("subject_id", id),
    supabase.from("teachers").select("*").order("created_at"),
  ]);
  const docs = (docRows ?? []) as Pick<StudyDocument, "id" | "type" | "teacher_id">[];
  const teachers = (teacherRows ?? []) as Teacher[];

  const countsByType = Object.fromEntries(
    DOCUMENT_TYPES.map((t) => [t, docs.filter((d) => d.type === t).length])
  );
  const styledTeacherIds = new Set(docs.map((d) => d.teacher_id).filter(Boolean));

  return (
    <div className="space-y-6">
      {/* Documents summary */}
      <Card>
        <div className="flex items-center justify-between">
          <h2 className="font-medium">Documents</h2>
          <Link href={`/subjects/${id}/documents`} className="text-sm text-gray-500 hover:underline">
            Manage →
          </Link>
        </div>
        {docs.length === 0 ? (
          <p className="mt-2 text-sm text-gray-500">
            No documents yet — the AI needs notes or past exams to work with.
          </p>
        ) : (
          <div className="mt-3 flex flex-wrap gap-2">
            {DOCUMENT_TYPES.map((t) => (
              <span key={t} className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700">
                {countsByType[t]} {t}
              </span>
            ))}
          </div>
        )}
      </Card>

      {/* Teacher styles */}
      <Card>
        <div className="flex items-center justify-between">
          <h2 className="font-medium">Teacher styles</h2>
          <Link href="/teachers" className="text-sm text-gray-500 hover:underline">
            Manage →
          </Link>
        </div>
        {teachers.length === 0 ? (
          <p className="mt-2 text-sm text-gray-500">
            Add teachers and tag their past exams to imitate their style.
          </p>
        ) : (
          <div className="mt-3 flex flex-wrap gap-2">
            {teachers.map((t) => (
              <span
                key={t.id}
                className="rounded-full border border-gray-200 px-3 py-1 text-sm text-gray-700"
                title={
                  styledTeacherIds.has(t.id)
                    ? "Has tagged documents in this subject"
                    : "No tagged documents in this subject yet"
                }
              >
                {t.name}
                {styledTeacherIds.has(t.id) ? " ✓" : ""}
              </span>
            ))}
          </div>
        )}
      </Card>

      {/* AI actions */}
      <Card>
        <h2 className="font-medium">AI study tools</h2>
        <p className="mt-1 text-sm text-gray-500">
          Generated from your documents — content from this subject, style from
          the teacher you pick.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href={`/subjects/${id}/generate?type=exam`} className={buttonClass("primary")}>
            Generate exam
          </Link>
          <Link href={`/subjects/${id}/generate?type=quiz`} className={buttonClass("ghost")}>
            Generate quiz
          </Link>
          <Link href={`/subjects/${id}/generate?type=flashcards`} className={buttonClass("ghost")}>
            Generate flashcards
          </Link>
        </div>
      </Card>
    </div>
  );
}
