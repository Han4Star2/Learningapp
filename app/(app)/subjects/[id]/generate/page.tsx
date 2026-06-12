import { createClient } from "@/lib/supabase/server";
import { GeneratePanel } from "@/components/generate/generate-panel";
import { AI_CONTENT_TYPES, type AIContentType, type Teacher } from "@/types/domain";

// Synchronous AI generation runs inside this route's Server Action. 60s is the
// Vercel Hobby ceiling, so it deploys everywhere; raise it (e.g. 300) on Pro.
export const maxDuration = 60;

export default async function GeneratePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ type?: string }>;
}) {
  const { id } = await params;
  const { type } = await searchParams;
  const initialType = AI_CONTENT_TYPES.includes(type as AIContentType)
    ? (type as AIContentType)
    : "exam";

  const supabase = await createClient();
  const { data } = await supabase.from("teachers").select("*").order("created_at");
  const teachers = (data ?? []) as Teacher[];

  return (
    <GeneratePanel subjectId={id} teachers={teachers} initialType={initialType} />
  );
}
