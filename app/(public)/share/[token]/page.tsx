import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ExamView } from "@/components/content/exam-view";
import { QuizView } from "@/components/content/quiz-view";
import { FlashcardDeck } from "@/components/content/flashcard-deck";
import { ExamSchema, QuizSchema, FlashcardSetSchema } from "@/lib/ai/schemas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Calendar, Clock, AlertTriangle } from "lucide-react";
import type { AIGeneratedContent } from "@/types/domain";

export default async function SharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();

  // Resolve the share link (public read policy allows unauthenticated access)
  const { data: linkRow, error: linkError } = await supabase
    .from("share_links")
    .select("*")
    .eq("token", token)
    .single();

  if (linkError || !linkRow) notFound();

  // Check expiry
  if (linkRow.expires_at && new Date(linkRow.expires_at) < new Date()) {
    return <ExpiredPage />;
  }

  if (linkRow.resource_type === "subject") {
    return <SubjectSharePage subjectId={linkRow.resource_id} />;
  }

  if (linkRow.resource_type === "ai_content") {
    return <AIContentSharePage contentId={linkRow.resource_id} />;
  }

  notFound();
}

// ── Subject share view ────────────────────────────────────────────────────────

async function SubjectSharePage({ subjectId }: { subjectId: string }) {
  const supabase = await createClient();

  const [{ data: subject }, { data: genRows }] = await Promise.all([
    supabase.from("subjects").select("name, color").eq("id", subjectId).single(),
    supabase
      .from("ai_generated_content")
      .select("id, title, type, created_at")
      .eq("subject_id", subjectId)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  if (!subject) notFound();

  const items = genRows ?? [];

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-10">
      <ShareHeader
        title={subject.name}
        subtitle="Shared study material"
        icon={<BookOpen className="size-5" />}
      />

      {items.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            No generated content has been shared for this subject yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {items.length} item{items.length !== 1 ? "s" : ""} shared
          </p>
          {items.map((item) => (
            <Card key={item.id}>
              <CardContent className="flex items-center justify-between gap-4 p-4">
                <div className="min-w-0">
                  <p className="truncate font-medium text-sm">{item.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(item.created_at).toLocaleDateString()}
                  </p>
                </div>
                <Badge variant="secondary" className="shrink-0 capitalize">
                  {item.type}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ShareFooter />
    </div>
  );
}

// ── AI content share view ─────────────────────────────────────────────────────

async function AIContentSharePage({ contentId }: { contentId: string }) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("ai_generated_content")
    .select("*")
    .eq("id", contentId)
    .single();

  if (!data) notFound();
  const item = data as AIGeneratedContent;

  let body: React.ReactNode;
  if (item.type === "exam") {
    const parsed = ExamSchema.safeParse(item.content_json);
    body = parsed.success ? <ExamView exam={parsed.data} /> : <InvalidContent />;
  } else if (item.type === "quiz") {
    const parsed = QuizSchema.safeParse(item.content_json);
    body = parsed.success ? <QuizView quiz={parsed.data} /> : <InvalidContent />;
  } else {
    const parsed = FlashcardSetSchema.safeParse(item.content_json);
    body = parsed.success ? <FlashcardDeck set={parsed.data} /> : <InvalidContent />;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-10">
      <ShareHeader
        title={item.title}
        subtitle={
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="secondary" className="capitalize">{item.type}</Badge>
            <span className="flex items-center gap-1">
              <Calendar className="size-3.5" />
              {new Date(item.created_at).toLocaleDateString()}
            </span>
          </div>
        }
        icon={<BookOpen className="size-5" />}
      />

      {body}

      <ShareFooter />
    </div>
  );
}

// ── Shared sub-components ─────────────────────────────────────────────────────

function ShareHeader({
  title,
  subtitle,
  icon,
}: {
  title: string;
  subtitle: React.ReactNode;
  icon: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wider mb-2">
        {icon}
        <span>Shared via StudyApp</span>
      </div>
      <h1 className="text-2xl font-bold">{title}</h1>
      {typeof subtitle === "string" ? (
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      ) : (
        subtitle
      )}
    </div>
  );
}

function ShareFooter() {
  return (
    <p className="text-center text-xs text-muted-foreground border-t pt-6">
      This content was shared read-only. Sign in to create your own study material.
    </p>
  );
}

function ExpiredPage() {
  return (
    <div className="mx-auto max-w-md space-y-4 px-4 py-20 text-center">
      <div className="flex justify-center text-amber-500">
        <Clock className="size-10" />
      </div>
      <h1 className="text-xl font-semibold">This share link has expired</h1>
      <p className="text-sm text-muted-foreground">
        The owner can generate a new link if they wish to share again.
      </p>
    </div>
  );
}

function InvalidContent() {
  return (
    <Card>
      <CardContent className="flex items-center gap-2 p-5 text-sm text-destructive">
        <AlertTriangle className="size-4 shrink-0" />
        This content couldn&apos;t be displayed.
      </CardContent>
    </Card>
  );
}
