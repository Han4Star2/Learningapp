import { createClient } from "@/lib/supabase/server";
import { deleteDocument } from "@/actions/documents";
import { DocumentForm } from "@/components/documents/document-form";
import { DeleteButton } from "@/components/delete-button";
import { Card } from "@/components/ui";
import type { StudyDocument, Teacher } from "@/types/domain";

export default async function DocumentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: docRows, error }, { data: teacherRows }] = await Promise.all([
    supabase
      .from("documents")
      .select("*")
      .eq("subject_id", id)
      .order("created_at", { ascending: false }),
    supabase.from("teachers").select("*").order("created_at"),
  ]);
  if (error) throw new Error(error.message);
  const documents = (docRows ?? []) as StudyDocument[];
  const teachers = (teacherRows ?? []) as Teacher[];
  const teacherName = (tid: string | null) =>
    teachers.find((t) => t.id === tid)?.name ?? null;

  return (
    <div className="space-y-6">
      <DocumentForm subjectId={id} teachers={teachers} />

      {documents.length === 0 ? (
        <Card>
          <p className="text-sm text-gray-500">
            No documents yet. Add notes, worksheets, textbook extracts — and tag
            past exams with their teacher to capture exam style.
          </p>
        </Card>
      ) : (
        <ul className="space-y-2">
          {documents.map((doc) => (
            <li key={doc.id}>
              <Card className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{doc.title}</p>
                  <p className="mt-0.5 flex flex-wrap gap-2 text-xs text-gray-500">
                    <span className="rounded bg-gray-100 px-2 py-0.5">{doc.type}</span>
                    {teacherName(doc.teacher_id) && (
                      <span className="rounded bg-gray-100 px-2 py-0.5">
                        {teacherName(doc.teacher_id)}
                      </span>
                    )}
                    {doc.storage_path && <span>📎 file attached</span>}
                    <span>{(doc.content ?? "").length.toLocaleString()} chars</span>
                  </p>
                </div>
                <DeleteButton
                  action={deleteDocument}
                  fields={{ id: doc.id, subject_id: id }}
                />
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
