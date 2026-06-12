import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ExamSchema, QuizSchema, FlashcardSetSchema } from "@/lib/ai/schemas";
import { Card, CardContent } from "@/components/ui/card";
import { ExamStudy } from "@/components/study/exam-study";
import { QuizStudy } from "@/components/study/quiz-study";
import { FlashcardStudy } from "@/components/study/flashcard-study";
import type { AIGeneratedContent } from "@/types/domain";

export default async function StudyPage({
  params,
}: {
  params: Promise<{ id: string; contentId: string }>;
}) {
  const { id, contentId } = await params;
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
    body = parsed.success ? <ExamStudy exam={parsed.data} /> : <InvalidContent />;
  } else if (item.type === "quiz") {
    const parsed = QuizSchema.safeParse(item.content_json);
    body = parsed.success ? <QuizStudy quiz={parsed.data} /> : <InvalidContent />;
  } else {
    const parsed = FlashcardSetSchema.safeParse(item.content_json);
    body = parsed.success ? <FlashcardStudy set={parsed.data} /> : <InvalidContent />;
  }

  const modeLabel =
    item.type === "exam" ? "Self-mark exam" : item.type === "quiz" ? "Quiz mode" : "Flashcard review";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link
          href={`/subjects/${id}/library/${contentId}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to viewer
        </Link>
        <span className="text-sm text-muted-foreground">·</span>
        <span className="text-sm font-medium">{modeLabel}</span>
      </div>
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
          can&apos;t be displayed in study mode.
        </p>
      </CardContent>
    </Card>
  );
}
