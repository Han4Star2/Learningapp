import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { deleteSubject } from "@/actions/subjects";
import { DeleteButton } from "@/components/delete-button";
import { SubjectTabs } from "@/components/shell/subject-tabs";
import type { Subject } from "@/types/domain";

export default async function SubjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("subjects")
    .select("*")
    .eq("id", id)
    .single();
  if (!data) notFound();
  const subject = data as Subject;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">{subject.name}</h1>
        <DeleteButton
          action={deleteSubject}
          fields={{ id: subject.id }}
          label="Delete subject"
        />
      </div>
      <SubjectTabs subjectId={subject.id} />
      {children}
    </div>
  );
}
