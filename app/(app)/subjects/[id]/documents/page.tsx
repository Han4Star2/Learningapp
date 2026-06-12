import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { DocumentDialog } from "@/components/documents/document-dialog";
import { DocumentsList } from "@/components/documents/documents-list";
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Documents</h2>
          <p className="text-sm text-muted-foreground">
            The content the AI reads. Tag exams with a teacher to capture style.
          </p>
        </div>
        <DocumentDialog
          subjectId={id}
          teachers={teachers}
          trigger={
            <Button>
              <Plus />
              Add document
            </Button>
          }
        />
      </div>

      <DocumentsList subjectId={id} documents={documents} teachers={teachers} />
    </div>
  );
}
