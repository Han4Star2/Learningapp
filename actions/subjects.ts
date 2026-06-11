"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return { supabase, user };
}

export async function createSubject(formData: FormData) {
  const schoolYearId = String(formData.get("school_year_id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const color = String(formData.get("color") ?? "").trim();
  if (!schoolYearId || !name) return;

  const { supabase, user } = await requireUser();
  await supabase.from("subjects").insert({
    user_id: user.id,
    school_year_id: schoolYearId,
    name,
    color: color || null,
  });

  revalidatePath(`/dashboard/years/${schoolYearId}`);
}

export async function deleteSubject(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const schoolYearId = String(formData.get("school_year_id") ?? "");
  if (!id) return;

  const { supabase } = await requireUser();
  await supabase.from("subjects").delete().eq("id", id);

  revalidatePath(`/dashboard/years/${schoolYearId}`);
}
