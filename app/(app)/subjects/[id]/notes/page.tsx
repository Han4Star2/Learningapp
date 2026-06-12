import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { NoteUploadDialog } from "@/components/notes/note-upload-dialog";
import { NotesList } from "@/components/notes/notes-list";
import type { Note } from "@/types/domain";

export default async function NotesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: noteRows, error } = await supabase
    .from("notes")
    .select("*")
    .eq("subject_id", id)
    .order("note_date", { ascending: false, nullsFirst: false });
  if (error) throw new Error(error.message);

  const notes = (noteRows ?? []) as Note[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Notes</h2>
          <p className="text-sm text-muted-foreground">
            Upload handwritten or printed notes for this subject.
          </p>
        </div>
        <NoteUploadDialog
          subjectId={id}
          trigger={
            <Button>
              <Plus />
              Upload note
            </Button>
          }
        />
      </div>

      <NotesList subjectId={id} notes={notes} />
    </div>
  );
}
