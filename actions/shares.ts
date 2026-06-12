"use server";

import { requireUser } from "@/lib/auth";
import type { ShareLink } from "@/types/domain";

export async function createShareLink(
  resourceType: "subject" | "ai_content",
  resourceId: string,
  expiresInDays?: number
): Promise<ShareLink | { error: string }> {
  if (!resourceId) return { error: "Resource ID is required." };

  const { supabase, user } = await requireUser();

  const expiresAt = expiresInDays
    ? new Date(Date.now() + expiresInDays * 86_400_000).toISOString()
    : null;

  const { data, error } = await supabase
    .from("share_links")
    .insert({
      user_id: user.id,
      resource_type: resourceType,
      resource_id: resourceId,
      expires_at: expiresAt,
    })
    .select()
    .single();

  if (error) return { error: error.message };
  return data as ShareLink;
}

export async function revokeShareLink(
  id: string
): Promise<{ ok: true } | { error: string }> {
  if (!id) return { error: "Link ID is required." };

  const { supabase } = await requireUser();

  const { error } = await supabase
    .from("share_links")
    .delete()
    .eq("id", id);

  if (error) return { error: error.message };
  return { ok: true };
}

export async function listShareLinks(
  resourceType: "subject" | "ai_content",
  resourceId: string
): Promise<ShareLink[] | { error: string }> {
  const { supabase } = await requireUser();

  const { data, error } = await supabase
    .from("share_links")
    .select("*")
    .eq("resource_type", resourceType)
    .eq("resource_id", resourceId)
    .order("created_at", { ascending: false });

  if (error) return { error: error.message };
  return (data ?? []) as ShareLink[];
}

/** Unauthenticated token lookup — for the public share page. */
export async function resolveShareToken(token: string): Promise<
  | { link: ShareLink; expired: false }
  | { expired: true }
  | { error: string }
> {
  if (!token) return { error: "Token is required." };

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("share_links")
    .select("*")
    .eq("token", token)
    .single();

  if (error || !data) return { error: "Share link not found." };

  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return { expired: true };
  }

  return { link: data as ShareLink, expired: false };
}
