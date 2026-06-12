import Link from "next/link";
import {
  FileText, GraduationCap, Sparkles, Plus,
  ClipboardList, ListChecks, Layers, BookOpen,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  DOCUMENT_TYPES, AI_CONTENT_TYPES,
  type StudyDocument, type AIGeneratedContent, type Teacher,
} from "@/types/domain";

const GEN_ICON = { exam: ClipboardList, quiz: ListChecks, flashcards: Layers };

export default async function SubjectHubPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: docRows }, { data: genRows }, { data: teacherRows }] =
    await Promise.all([
      supabase.from("documents").select("id, title, type, teacher_id, created_at").eq("subject_id", id).order("created_at", { ascending: false }),
      supabase.from("ai_generated_content").select("id, title, type, created_at").eq("subject_id", id).order("created_at", { ascending: false }),
      supabase.from("teachers").select("*").order("created_at"),
    ]);

  const docs = (docRows ?? []) as Pick<StudyDocument, "id" | "title" | "type" | "teacher_id" | "created_at">[];
  const generated = (genRows ?? []) as Pick<AIGeneratedContent, "id" | "title" | "type" | "created_at">[];
  const teachers = (teacherRows ?? []) as Teacher[];

  const countsByType = Object.fromEntries(DOCUMENT_TYPES.map((t) => [t, docs.filter((d) => d.type === t).length]));
  const genCountsByType = Object.fromEntries(AI_CONTENT_TYPES.map((t) => [t, generated.filter((g) => g.type === t).length]));
  const taggedTeacherIds = new Set(docs.map((d) => d.teacher_id).filter(Boolean));

  const recent = [
    ...docs.map((d) => ({ key: `doc-${d.id}`, label: d.title, kind: `${d.type}`, cat: "doc" as const, created_at: d.created_at, href: `/subjects/${id}/documents` })),
    ...generated.map((g) => ({ key: `gen-${g.id}`, label: g.title, kind: g.type, cat: "gen" as const, created_at: g.created_at, href: `/subjects/${id}/library/${g.id}` })),
  ].sort((a, b) => (a.created_at < b.created_at ? 1 : -1)).slice(0, 6);

  return (
    <div className="space-y-5">
      {/* Stats row */}
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard icon={<FileText className="size-4" />} value={docs.length} label="Documents" color="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" />
        <StatCard icon={<Sparkles className="size-4" />} value={generated.length} label="Generated items" color="bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400" />
        <StatCard icon={<GraduationCap className="size-4" />} value={taggedTeacherIds.size} label={`of ${teachers.length} teachers`} color="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" />
      </div>

      {/* Generated content breakdown */}
      {generated.length > 0 && (
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold">Generated content</CardTitle>
            <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
              <Link href={`/subjects/${id}/library`}>View library</Link>
            </Button>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {AI_CONTENT_TYPES.map((t) => (
              <Badge key={t} variant="secondary" className="capitalize gap-1.5">
                {genCountsByType[t]} {t}
              </Badge>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Documents by type */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-semibold">Documents by type</CardTitle>
          <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
            <Link href={`/subjects/${id}/documents`}>Manage</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {docs.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No documents yet — add notes, worksheets, or past exams to get started.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {DOCUMENT_TYPES.map((t) => (
                <Badge key={t} variant="outline" className="capitalize gap-1">
                  {countsByType[t]} {t}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Quick actions</CardTitle>
          <CardDescription className="text-xs">
            Content comes from this subject — style from the teacher you choose.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button size="sm" asChild>
            <Link href={`/subjects/${id}/generate?type=exam`}><ClipboardList /> Exam</Link>
          </Button>
          <Button size="sm" variant="outline" asChild>
            <Link href={`/subjects/${id}/generate?type=quiz`}><ListChecks /> Quiz</Link>
          </Button>
          <Button size="sm" variant="outline" asChild>
            <Link href={`/subjects/${id}/generate?type=flashcards`}><Layers /> Flashcards</Link>
          </Button>
          <Button size="sm" variant="ghost" asChild>
            <Link href={`/subjects/${id}/documents`}><Plus /> Upload doc</Link>
          </Button>
          <Button size="sm" variant="ghost" asChild>
            <Link href={`/subjects/${id}/library`}><BookOpen /> Library</Link>
          </Button>
        </CardContent>
      </Card>

      {/* Recent activity */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Recent activity</CardTitle>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nothing here yet. Add a document or generate study material to get started.
            </p>
          ) : (
            <ul className="divide-y divide-border/50">
              {recent.map((item) => {
                const Icon =
                  item.cat === "gen"
                    ? GEN_ICON[item.kind as keyof typeof GEN_ICON] ?? FileText
                    : FileText;
                return (
                  <li key={item.key}>
                    <Link
                      href={item.href}
                      className="flex items-center gap-3 py-2.5 text-sm transition-colors hover:text-primary"
                    >
                      <Icon className="size-4 shrink-0 text-muted-foreground" />
                      <span className="min-w-0 flex-1 truncate font-medium">{item.label}</span>
                      <Badge variant="secondary" className="shrink-0 capitalize text-[10px]">
                        {item.kind}
                      </Badge>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ icon, value, label, color }: { icon: React.ReactNode; value: number; label: string; color: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", color)}>
          {icon}
        </div>
        <div>
          <p className="text-xl font-bold leading-none tabular-nums">{value}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
