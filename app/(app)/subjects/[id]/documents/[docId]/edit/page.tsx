import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DocumentEditForm } from "@/components/documents/document-edit-form";
import type { StudyDocument, Teacher } from "@/types/domain";

export default async function DocumentEditPage({
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

  return (
    <div className="space-y-4">
      <Link
        href={`/subjects/${id}/documents/${docId}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to document
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Edit document</CardTitle>
        </CardHeader>
        <CardContent>
          <DocumentEditForm document={doc} subjectId={id} teachers={teachers} />
        </CardContent>
      </Card>
    </div>
  );
}
