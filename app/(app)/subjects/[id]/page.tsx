import Link from "next/link";
import {
  FileText,
  GraduationCap,
  Sparkles,
  Plus,
  ClipboardList,
  ListChecks,
  Layers,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DOCUMENT_TYPES,
  type StudyDocument,
  type AIGeneratedContent,
  type Teacher,
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
      supabase
        .from("documents")
        .select("id, title, type, teacher_id, created_at")
        .eq("subject_id", id)
        .order("created_at", { ascending: false }),
      supabase
        .from("ai_generated_content")
        .select("id, title, type, created_at")
        .eq("subject_id", id)
        .order("created_at", { ascending: false }),
      supabase.from("teachers").select("*").order("created_at"),
    ]);

  const docs = (docRows ?? []) as Pick<
    StudyDocument,
    "id" | "title" | "type" | "teacher_id" | "created_at"
  >[];
  const generated = (genRows ?? []) as Pick<
    AIGeneratedContent,
    "id" | "title" | "type" | "created_at"
  >[];
  const teachers = (teacherRows ?? []) as Teacher[];

  const countsByType = Object.fromEntries(
    DOCUMENT_TYPES.map((t) => [t, docs.filter((d) => d.type === t).length])
  );
  const taggedTeacherIds = new Set(
    docs.map((d) => d.teacher_id).filter(Boolean)
  );

  const recent = [
    ...docs.map((d) => ({
      key: `doc-${d.id}`,
      label: d.title,
      kind: `Document · ${d.type}`,
      created_at: d.created_at,
      href: `/subjects/${id}/documents`,
    })),
    ...generated.map((g) => ({
      key: `gen-${g.id}`,
      label: g.title,
      kind: `Generated · ${g.type}`,
      created_at: g.created_at,
      href: `/subjects/${id}/library/${g.id}`,
    })),
  ]
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    .slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={<FileText className="size-5" />}
          value={docs.length}
          label="Documents"
        />
        <StatCard
          icon={<Sparkles className="size-5" />}
          value={generated.length}
          label="Generated items"
        />
        <StatCard
          icon={<GraduationCap className="size-5" />}
          value={taggedTeacherIds.size}
          label={`Teachers tagged · ${teachers.length} total`}
        />
      </div>

      {/* Document breakdown */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Documents by type</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/subjects/${id}/documents`}>Manage</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {docs.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No documents yet — the AI needs notes or past exams to work with.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {DOCUMENT_TYPES.map((t) => (
                <Badge key={t} variant="secondary" className="capitalize">
                  {countsByType[t]} {t}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick actions</CardTitle>
          <CardDescription>
            Content comes from this subject; style from the teacher you pick.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href={`/subjects/${id}/generate?type=exam`}>
              <ClipboardList /> Generate exam
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/subjects/${id}/generate?type=quiz`}>
              <ListChecks /> Generate quiz
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/subjects/${id}/generate?type=flashcards`}>
              <Layers /> Generate flashcards
            </Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href={`/subjects/${id}/documents`}>
              <Plus /> Add document
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Recent activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent activity</CardTitle>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nothing here yet. Add a document or generate study material to get
              started.
            </p>
          ) : (
            <ul className="divide-y">
              {recent.map((item) => {
                const Icon =
                  item.kind.startsWith("Generated") &&
                  item.kind.includes("exam")
                    ? GEN_ICON.exam
                    : item.kind.includes("quiz")
                      ? GEN_ICON.quiz
                      : item.kind.includes("flashcards")
                        ? GEN_ICON.flashcards
                        : FileText;
                return (
                  <li key={item.key}>
                    <Link
                      href={item.href}
                      className="flex items-center gap-3 py-2.5 transition-colors hover:text-foreground"
                    >
                      <Icon className="size-4 shrink-0 text-muted-foreground" />
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">
                        {item.label}
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {item.kind}
                      </span>
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

function StatCard({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className="flex size-11 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold leading-none">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
