import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ExamView } from "@/components/content/exam-view";
import { QuizView } from "@/components/content/quiz-view";
import { FlashcardDeck } from "@/components/content/flashcard-deck";
import { ArrowLeft } from "lucide-react";
import { ExamSchema, QuizSchema, FlashcardSetSchema } from "@/lib/ai/schemas";
import { Card, CardContent } from "@/components/ui/card";
import type { AIGeneratedContent } from "@/types/domain";

export default async function ContentPage({
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

  return (
    <div className="space-y-4">
      <Link
        href={`/subjects/${id}/library`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Library
      </Link>
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
