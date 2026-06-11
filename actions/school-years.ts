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

export async function createSchoolYear(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const levelRaw = String(formData.get("level") ?? "").trim();
  if (!name) return;

  const { supabase, user } = await requireUser();
  await supabase.from("school_years").insert({
    user_id: user.id,
    name,
    level: levelRaw ? Number(levelRaw) : null,
  });

  revalidatePath("/dashboard");
}

export async function deleteSchoolYear(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const { supabase } = await requireUser();
  await supabase.from("school_years").delete().eq("id", id);

  revalidatePath("/dashboard");
}
