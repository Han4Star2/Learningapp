"use server";

import { getOpenAIClient, IMAGE_MODEL } from "@/lib/openai/client";

export type StudioResult = {
  imageBase64: string; // raw base64, no data-URI prefix
  prompt: string;
};

export async function generateStudioImage(input: {
  prompt: string;
  referenceBase64?: string; // JPEG base64 compressed client-side, no prefix
  size?: "1024x1024" | "1536x1024" | "1024x1536";
}): Promise<StudioResult | { error: string }> {
  const prompt = input.prompt?.trim();
  if (!prompt) return { error: "Prompt cannot be empty." };
  if (prompt.length > 2000) return { error: "Prompt too long (max 2000 chars)." };

  let openai;
  try {
    openai = getOpenAIClient();
  } catch {
    return { error: "AI service is not configured." };
  }

  const size = input.size ?? "1024x1024";
  let b64: string | undefined;

  try {
    if (input.referenceBase64) {
      // Image-to-image via the edit endpoint
      const buffer = Buffer.from(input.referenceBase64, "base64");
      const refFile = new File([buffer], "reference.jpg", { type: "image/jpeg" });

      const response = await openai.images.edit({
        model: IMAGE_MODEL,
        image: refFile,
        prompt,
        n: 1,
        size: "1024x1024", // edit endpoint only supports square
        response_format: "b64_json",
      } as Parameters<typeof openai.images.edit>[0]);

      b64 = response.data?.[0]?.b64_json ?? undefined;
    } else {
      // Pure text-to-image
      const response = await openai.images.generate({
        model: IMAGE_MODEL,
        prompt,
        n: 1,
        size,
        response_format: "b64_json",
      });

      b64 = response.data?.[0]?.b64_json ?? undefined;
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    if (msg.includes("API key")) return { error: "AI authentication failed." };
    if (msg.includes("rate limit")) return { error: "Too many requests — please wait a moment." };
    if (msg.includes("safety") || msg.includes("content_policy") || msg.includes("content policy")) {
      return { error: "Prompt rejected by safety filter. Try rephrasing." };
    }
    return { error: `Generation failed: ${msg}` };
  }

  if (!b64) return { error: "No image returned." };
  return { imageBase64: b64, prompt };
}
