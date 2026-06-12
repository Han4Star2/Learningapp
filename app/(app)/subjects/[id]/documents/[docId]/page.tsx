import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Paperclip, Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeleteDocumentButton } from "@/components/documents/delete-document-button";
import type { StudyDocument, Teacher } from "@/types/domain";

export default async function DocumentPreviewPage({
  params,
}: {
  params: Promise<{ id: string; docId: string }>;
}) {
  const { id, docId } = await params;
  const supabase = await createClient();

  const [{ data: docData }, { data: teacherRows }] = await Promise.all([
    supabase.from("documents").select("*").eq("id", docId).single(),
    supabase.from("teachers").select("*").order("created_at"),
  ]);

  if (!docData) notFound();
  const doc = docData as StudyDocument;
  const teachers = (teacherRows ?? []) as Teacher[];
  const teacher = teachers.find((t) => t.id === doc.teacher_id);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <Link
          href={`/subjects/${id}/documents`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Documents
        </Link>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/subjects/${id}/documents/${docId}/edit`}>
              <Pencil className="size-4" />
              Edit
            </Link>
          </Button>
          <DeleteDocumentButton docId={doc.id} subjectId={id} />
        </div>
      </div>

      <Card>
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <CardTitle className="text-xl">{doc.title}</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="capitalize">
                {doc.type}
              </Badge>
              {teacher && <Badge variant="outline">{teacher.name}</Badge>}
              {doc.storage_path && (
                <Badge variant="outline" className="gap-1">
                  <Paperclip className="size-3" />
                  File attached
                </Badge>
              )}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Added {new Date(doc.created_at).toLocaleString()} ·{" "}
            {(doc.content ?? "").length.toLocaleString()} characters
          </p>
        </CardHeader>
        <CardContent>
          {doc.content ? (
            <pre className="max-h-[60vh] overflow-y-auto whitespace-pre-wrap rounded-md bg-muted p-4 text-sm">
              {doc.content}
            </pre>
          ) : (
            <p className="text-sm text-muted-foreground">No text content.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
