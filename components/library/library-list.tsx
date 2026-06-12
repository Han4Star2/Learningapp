"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2, ClipboardList, ListChecks, Layers, ChevronRight, Pencil, Copy, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { deleteGeneratedContent, renameGeneratedContent, duplicateGeneratedContent } from "@/actions/generate";
import type { AIGeneratedContent, AIContentType } from "@/types/domain";

const TYPE_META: Record<AIContentType, {
  label: string;
  icon: typeof ClipboardList;
  color: string;
}> = {
  exam:       { label: "Exam",       icon: ClipboardList, color: "text-rose-500   bg-rose-100   dark:bg-rose-900/30" },
  quiz:       { label: "Quiz",       icon: ListChecks,    color: "text-amber-500  bg-amber-100  dark:bg-amber-900/30" },
  flashcards: { label: "Flashcards", icon: Layers,        color: "text-blue-500   bg-blue-100   dark:bg-blue-900/30" },
};

type Item = Pick<AIGeneratedContent, "id" | "type" | "title" | "created_at" | "source_document_ids">;

function RenameDialog({ item, subjectId }: { item: Item; subjectId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(item.title);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await renameGeneratedContent(item.id, subjectId, title);
      if ("error" in result) { setError(result.error); return; }
      toast.success("Renamed.");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="size-7 rounded-lg" aria-label="Rename" onClick={(e) => e.preventDefault()}>
          <Pencil className="size-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm" onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>Rename</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} autoFocus required />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DuplicateButton({ item, subjectId }: { item: Item; subjectId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleDuplicate(e: React.MouseEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await duplicateGeneratedContent(item.id, subjectId);
      if ("error" in result) { toast.error(result.error); return; }
      toast.success("Duplicated.");
      router.refresh();
    });
  }

  return (
    <Button variant="ghost" size="icon" className="size-7 rounded-lg" aria-label="Duplicate" disabled={pending} onClick={handleDuplicate}>
      <Copy className="size-3.5" />
    </Button>
  );
}

export function LibraryList({ subjectId, items }: { subjectId: string; items: Item[] }) {
  const router = useRouter();

  return (
    <ul className="space-y-2">
      {items.map((item) => {
        const meta = TYPE_META[item.type];
        const Icon = meta.icon;
        return (
          <li key={item.id} className="group relative">
            <Link href={`/subjects/${subjectId}/library/${item.id}`}>
              <Card className="transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${meta.color}`}>
                    <Icon className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{item.title}</p>
                    <p className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">{meta.label}</Badge>
                      {new Date(item.created_at).toLocaleDateString()} ·{" "}
                      {item.source_document_ids.length} source{item.source_document_ids.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5" />
                </CardContent>
              </Card>
            </Link>

            {/* Hover action buttons */}
            <div className="absolute right-10 top-1/2 flex -translate-y-1/2 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
              <Button
                variant="ghost"
                size="icon"
                className="size-7 rounded-lg"
                aria-label="Study"
                asChild
                onClick={(e) => e.stopPropagation()}
              >
                <Link href={`/subjects/${subjectId}/library/${item.id}/study`}>
                  <BookOpen className="size-3.5" />
                </Link>
              </Button>
              <RenameDialog item={item} subjectId={subjectId} />
              <DuplicateButton item={item} subjectId={subjectId} />
              <ConfirmDialog
                title="Delete from library"
                description="This permanently removes the generated content."
                onConfirm={async () => {
                  await deleteGeneratedContent(item.id, subjectId);
                  toast.success("Deleted.");
                  router.refresh();
                }}
                trigger={
                  <Button variant="ghost" size="icon" className="size-7 rounded-lg text-destructive/70 hover:text-destructive" aria-label="Delete" onClick={(e) => e.preventDefault()}>
                    <Trash2 className="size-3.5" />
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
