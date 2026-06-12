import { createClient } from "@/lib/supabase/server";
import { UploadHub } from "@/components/upload/upload-hub";
import type { Subject, Teacher } from "@/types/domain";

export const maxDuration = 60;

export default async function UploadPage() {
  const supabase = await createClient();

  const [{ data: subjectRows }, { data: teacherRows }] = await Promise.all([
    supabase.from("subjects").select("*").order("name"),
    supabase.from("teachers").select("*").order("name"),
  ]);

  return (
    <UploadHub
      subjects={(subjectRows ?? []) as Subject[]}
      teachers={(teacherRows ?? []) as Teacher[]}
    />
  );
}
