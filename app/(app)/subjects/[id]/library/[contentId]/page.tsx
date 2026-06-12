import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ExamView } from "@/components/content/exam-view";
import { QuizView } from "@/components/content/quiz-view";
import { FlashcardDeck } from "@/components/content/flashcard-deck";
import { ArrowLeft, BookOpen, GraduationCap, Calendar, Hash, Layers } from "lucide-react";
import { ExamSchema, QuizSchema, FlashcardSetSchema } from "@/lib/ai/schemas";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { AIGeneratedContent, Teacher } from "@/types/domain";

export default async function ContentPage({
  params,
}: {
  params: Promise<{ id: string; contentId: string }>;
}) {
  const { id, contentId } = await params;
  const supabase = await createClient();

  const [{ data }, { data: teacherRows }] = await Promise.all([
    supabase.from("ai_generated_content").select("*").eq("id", contentId).single(),
    supabase.from("teachers").select("*").order("created_at"),
  ]);

  if (!data) notFound();
  const item = data as AIGeneratedContent;
  const teachers = (teacherRows ?? []) as Teacher[];
  const teacher = teachers.find((t) => t.id === item.teacher_id);

  const gs = item.generation_settings;

  let body: React.ReactNode;
  if (item.type === "exam") {
    const parsed = ExamSchema.safeParse(item.content_json);
    body = parsed.success ? <ExamView exam={parsed.data} /> : <InvalidContent />;
  } else if (item.type === "quiz") {
    const parsed = QuizSchema.safeParse(item.content_json);
    body = parsed.success ? <QuizView quiz={parsed.data} /> : <InvalidContent />;
  } else {
    const parsed = FlashcardSetSchema.safeParse(item.content_json);
    body = parsed.success ? (
      <FlashcardDeck set={parsed.data} />
    ) : (
      <InvalidContent />
    );
  }

  const studyLabel =
    item.type === "exam" ? "Self-mark" : item.type === "quiz" ? "Take quiz" : "Study cards";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <Link
          href={`/subjects/${id}/library`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Library
        </Link>
        <Button asChild>
          <Link href={`/subjects/${id}/library/${contentId}/study`}>
            <BookOpen className="size-4" />
            {studyLabel}
          </Link>
        </Button>
      </div>

      {/* Generation history / metadata */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-4 p-4 text-sm">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Badge variant="secondary" className="capitalize">{item.type}</Badge>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Calendar className="size-3.5" />
            {new Date(item.created_at).toLocaleString()}
          </div>
          {teacher && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <GraduationCap className="size-3.5" />
              {teacher.name} style
            </div>
          )}
          {gs && (
            <>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Hash className="size-3.5" />
                {gs.count} {item.type === "flashcards" ? "cards" : "questions"}
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Layers className="size-3.5" />
                {gs.difficulty} difficulty
              </div>
              {gs.total_marks && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  {gs.total_marks} marks
                </div>
              )}
            </>
          )}
          <div className="flex items-center gap-1.5 text-muted-foreground">
            {item.source_document_ids.length} source doc{item.source_document_ids.length !== 1 ? "s" : ""}
          </div>
        </CardContent>
      </Card>

      {body}
    </div>
  );
}

function InvalidContent() {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-sm text-destructive">
          This item&apos;s stored content doesn&apos;t match its schema and
          can&apos;t be displayed.
        </p>
      </CardContent>
    </Card>
  );
}
