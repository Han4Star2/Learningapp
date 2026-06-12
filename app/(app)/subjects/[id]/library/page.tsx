import { Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { LibraryList } from "@/components/library/library-list";
import type { AIGeneratedContent } from "@/types/domain";

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

  return <LibraryList subjectId={id} items={items} />;
}
