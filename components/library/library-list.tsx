"use client";

import Link from "next/link";
import { Trash2, ClipboardList, ListChecks, Layers, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { deleteGeneratedContent } from "@/actions/generate";
import type { AIGeneratedContent, AIContentType } from "@/types/domain";

const TYPE_META: Record<AIContentType, { label: string; icon: typeof ClipboardList }> = {
  exam: { label: "Exam", icon: ClipboardList },
  quiz: { label: "Quiz", icon: ListChecks },
  flashcards: { label: "Flashcards", icon: Layers },
};

type Item = Pick<AIGeneratedContent, "id" | "type" | "title" | "created_at" | "source_document_ids">;

export function LibraryList({
  subjectId,
  items,
}: {
  subjectId: string;
  items: Item[];
}) {
  return (
    <ul className="space-y-2">
      {items.map((item) => {
        const meta = TYPE_META[item.type];
        const Icon = meta.icon;
        return (
          <li key={item.id} className="group relative">
            <Link href={`/subjects/${subjectId}/library/${item.id}`}>
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
                      {item.source_document_ids.length} source
                      {item.source_document_ids.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
            {/* Delete button shown on hover, positioned over the card */}
            <div className="absolute right-12 top-1/2 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
              <ConfirmDialog
                title="Delete from library"
                description="This permanently removes the generated content from your library."
                onConfirm={() => deleteGeneratedContent(item.id, subjectId)}
                trigger={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-destructive"
                    aria-label="Delete"
                    onClick={(e) => e.preventDefault()}
                  >
                    <Trash2 />
                  </Button>
                }
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
