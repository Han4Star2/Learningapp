import { createClient } from "@/lib/supabase/server";
import { GeneratePanel } from "@/components/generate/generate-panel";
import { AI_CONTENT_TYPES, type AIContentType, type Teacher } from "@/types/domain";

// Synchronous AI generation runs inside this route's Server Action —
// give it headroom beyond the default function timeout.
export const maxDuration = 120;

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
