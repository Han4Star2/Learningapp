import Link from "next/link";
import {
  ClipboardList,
  ListChecks,
  Layers,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AIGeneratedContent, AIContentType } from "@/types/domain";

const TYPE_META: Record<AIContentType, { label: string; icon: typeof ClipboardList }> = {
  exam: { label: "Exam", icon: ClipboardList },
  quiz: { label: "Quiz", icon: ListChecks },
  flashcards: { label: "Flashcards", icon: Layers },
};

export default async function LibraryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ai_generated_content")
    .select("id, type, title, created_at, source_document_ids")
    .eq("subject_id", id)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  const items = (data ?? []) as Pick<
    AIGeneratedContent,
    "id" | "type" | "title" | "created_at" | "source_document_ids"
  >[];

  if (items.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center gap-3 p-12 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-muted">
          <Sparkles className="size-6 text-muted-foreground" />
        </div>
        <div>
          <p className="font-medium">Nothing generated yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Head to the Generate tab to create your first exam, quiz or
            flashcard set.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <ul className="space-y-2">
      {items.map((item) => {
        const meta = TYPE_META[item.type];
        const Icon = meta.icon;
        return (
          <li key={item.id}>
            <Link href={`/subjects/${id}/library/${item.id}`}>
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <Icon className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{item.title}</p>
                    <p className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="secondary">{meta.label}</Badge>
                      {new Date(item.created_at).toLocaleString()} ·{" "}
                      {item.source_document_ids.length} sources
                    </p>
                  </div>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
