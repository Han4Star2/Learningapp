import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui";
import type { AIGeneratedContent } from "@/types/domain";

const TYPE_LABEL: Record<string, string> = {
  exam: "Exam",
  quiz: "Quiz",
  flashcards: "Flashcards",
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

  return (
    <div className="space-y-4">
      {items.length === 0 ? (
        <Card>
          <p className="text-sm text-gray-500">
            Nothing generated yet. Head to the Generate tab to create your first
            exam, quiz or flashcard set.
          </p>
        </Card>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id}>
              <Link href={`/subjects/${id}/library/${item.id}`}>
                <Card className="flex items-center justify-between transition hover:border-gray-400">
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {TYPE_LABEL[item.type]} ·{" "}
                      {new Date(item.created_at).toLocaleString()} · from{" "}
                      {item.source_document_ids.length} documents
                    </p>
                  </div>
                  <span className="text-sm text-gray-400">View →</span>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
