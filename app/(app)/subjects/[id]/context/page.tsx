import Link from "next/link";
import { FileText, Layers } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { StudyDocument, Teacher } from "@/types/domain";

export default async function ContextPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: docRows }, { data: teacherRows }] = await Promise.all([
    supabase
      .from("documents")
      .select("id, title, type, teacher_id, content, created_at")
      .eq("subject_id", id)
      .order("created_at", { ascending: true }),
    supabase.from("teachers").select("*").order("created_at"),
  ]);

  const docs = (docRows ?? []) as Pick<
    StudyDocument,
    "id" | "title" | "type" | "teacher_id" | "content" | "created_at"
  >[];
  const teachers = (teacherRows ?? []) as Teacher[];
  const teacherMap = Object.fromEntries(teachers.map((t) => [t.id, t.name]));

  const contentDocs = docs.filter((d) => (d.content ?? "").trim().length > 0);
  const styleDocs = contentDocs.filter(
    (d) => d.type === "exam" && d.teacher_id
  );

  const totalChars = contentDocs.reduce((s, d) => s + (d.content?.length ?? 0), 0);
  const styleChars = styleDocs.reduce((s, d) => s + (d.content?.length ?? 0), 0);
  const estimatedTokens = Math.round(totalChars / 4);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">AI Context</h2>
        <p className="text-sm text-muted-foreground">
          What the AI reads when generating content for this subject.
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Content documents" value={contentDocs.length} />
        <StatCard label="Total characters" value={totalChars.toLocaleString()} />
        <StatCard label="Est. tokens" value={`~${estimatedTokens.toLocaleString()}`} />
      </div>

      {/* Content layer */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="size-4 text-muted-foreground" />
            <CardTitle className="text-base">Content layer</CardTitle>
          </div>
          <CardDescription>
            All documents in this subject — the AI learns the topic from these.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {contentDocs.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No documents with text yet.{" "}
              <Link href={`/subjects/${id}/documents`} className="underline hover:text-foreground">
                Add documents
              </Link>{" "}
              to give the AI something to read.
            </p>
          ) : (
            <ul className="divide-y">
              {contentDocs.map((doc) => (
                <li key={doc.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/subjects/${id}/documents/${doc.id}`}
                      className="truncate text-sm font-medium hover:underline"
                    >
                      {doc.title}
                    </Link>
                    <div className="mt-0.5 flex flex-wrap gap-1.5">
                      <Badge variant="secondary" className="text-xs capitalize">
                        {doc.type}
                      </Badge>
                      {doc.teacher_id && teacherMap[doc.teacher_id] && (
                        <Badge variant="outline" className="text-xs">
                          {teacherMap[doc.teacher_id]}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {(doc.content?.length ?? 0).toLocaleString()} chars
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Style layer */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Layers className="size-4 text-muted-foreground" />
            <CardTitle className="text-base">Style layer</CardTitle>
          </div>
          <CardDescription>
            Teacher-tagged exams — the AI mirrors their question style when a teacher is selected.
            {styleChars > 0 && (
              <span className="ml-1">
                ({styleChars.toLocaleString()} chars · ~{Math.round(styleChars / 4).toLocaleString()} tokens)
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {styleDocs.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No teacher-tagged exams yet. Upload a past exam and assign it to a teacher to enable
              style matching.
            </p>
          ) : (
            <ul className="divide-y">
              {styleDocs.map((doc) => (
                <li key={doc.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/subjects/${id}/documents/${doc.id}`}
                      className="truncate text-sm font-medium hover:underline"
                    >
                      {doc.title}
                    </Link>
                    {doc.teacher_id && teacherMap[doc.teacher_id] && (
                      <Badge variant="outline" className="mt-0.5 text-xs">
                        {teacherMap[doc.teacher_id]}
                      </Badge>
                    )}
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {(doc.content?.length ?? 0).toLocaleString()} chars
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-2xl font-bold leading-none">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}
