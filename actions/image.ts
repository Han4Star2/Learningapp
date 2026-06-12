"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getOpenAIClient, IMAGE_MODEL } from "@/lib/openai/client";
import { requireUser } from "@/lib/auth";

const VALID_STYLES = ["realistic", "anime", "sketch", "diagram", "watercolor"] as const;
type ImageStyle = (typeof VALID_STYLES)[number];

const ImageResultSchema = z.object({
  id: z.string(),
  image_url: z.string(),
  prompt: z.string(),
});
export type ImageResult = z.infer<typeof ImageResultSchema>;

const STYLE_MODIFIERS: Record<ImageStyle, string> = {
  realistic: "photorealistic, detailed, high quality",
  anime:     "anime style, vibrant colors, clean lines",
  sketch:    "pencil sketch, hand-drawn, black and white",
  diagram:   "educational diagram, clean, labeled, technical illustration",
  watercolor:"watercolor painting, soft colors, artistic",
};

function buildPrompt(prompt: string, style?: ImageStyle): string {
  const base = prompt.trim();
  if (!style || !STYLE_MODIFIERS[style]) return base;
  return `${base}. Style: ${STYLE_MODIFIERS[style]}`;
}

/**
 * Generates a study image using OpenAI, stores in Supabase Storage,
 * and persists metadata to the ai_images table.
 */
export async function generateImage(input: {
  prompt: string;
  style?: ImageStyle;
}): Promise<ImageResult | { error: string }> {
  const prompt = input.prompt?.trim();
  if (!prompt) return { error: "Prompt cannot be empty." };
  if (prompt.length > 1000) return { error: "Prompt is too long (max 1000 characters)." };
  if (input.style && !VALID_STYLES.includes(input.style)) {
    return { error: `Invalid style. Choose from: ${VALID_STYLES.join(", ")}.` };
  }

  let openai;
  try {
    openai = getOpenAIClient();
  } catch {
    return { error: "AI service is not configured. Contact the site administrator." };
  }

  const { supabase, user } = await requireUser();

  const fullPrompt = buildPrompt(prompt, input.style);

  // ── Generate image ────────────────────────────────────────────────────────
  let b64: string | undefined;
  let directUrl: string | undefined;

  try {
    const response = await openai.images.generate({
      model: IMAGE_MODEL,
      prompt: fullPrompt,
      n: 1,
      size: "1024x1024",
      response_format: "b64_json",
    });

    const imageData = response.data?.[0];
    b64 = imageData?.b64_json ?? undefined;
    directUrl = imageData?.url ?? undefined;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    if (msg.includes("API key")) return { error: "AI service authentication failed." };
    if (msg.includes("rate limit")) return { error: "Too many requests. Please wait a moment." };
    if (msg.includes("safety")) return { error: "Prompt was rejected by safety filters. Please rephrase." };
    if (msg.includes("model")) return { error: `Image model unavailable: ${IMAGE_MODEL}` };
    return { error: `Image generation failed: ${msg}` };
  }

  if (!b64 && !directUrl) {
    return { error: "Image generation returned no data." };
  }

  // ── Upload to Supabase Storage (preferred — stable URL) ──────────────────
  let imageUrl: string;

  if (b64) {
    try {
      const buffer = Buffer.from(b64, "base64");
      const filename = `${user.id}/${Date.now()}.png`;

      const { error: uploadError } = await supabase.storage
        .from("ai-images")
        .upload(filename, buffer, { contentType: "image/png", upsert: false });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("ai-images")
        .getPublicUrl(filename);

      imageUrl = publicUrl;
    } catch {
      // Storage not set up — fall back to transient URL or data URI
      imageUrl = directUrl ?? `data:image/png;base64,${b64}`;
    }
  } else {
    // Model returned a direct URL (e.g. dall-e-3 style)
    imageUrl = directUrl!;
  }

  // ── Persist metadata ──────────────────────────────────────────────────────
  const { data: inserted, error: dbError } = await supabase
    .from("ai_images")
    .insert({
      user_id: user.id,
      prompt,
      style: input.style ?? null,
      image_url: imageUrl,
    })
    .select("id, image_url, prompt")
    .single();

  if (dbError || !inserted) {
    return { error: dbError?.message ?? "Could not save the generated image." };
  }

  revalidatePath("/dashboard");
  return ImageResultSchema.parse(inserted);
}

/**
 * Deletes a generated image record (and its file from storage if applicable).
 */
export async function deleteImage(
  id: string
): Promise<{ ok: true } | { error: string }> {
  if (!id) return { error: "ID is required." };
  const { supabase } = await requireUser();

  const { data } = await supabase
    .from("ai_images")
    .select("image_url")
    .eq("id", id)
    .single();

  if (data?.image_url) {
    // Attempt to remove the file from storage (best-effort)
    const urlParts = data.image_url.split("/storage/v1/object/public/ai-images/");
    if (urlParts.length === 2) {
      await supabase.storage.from("ai-images").remove([urlParts[1]]);
    }
  }

  const { error } = await supabase.from("ai_images").delete().eq("id", id);
  if (error) return { error: error.message };
  return { ok: true };
}
