"use server";

import { z } from "zod";
import { getOpenAIClient, CHAT_MODEL } from "@/lib/openai/client";

const ResponseSchema = z.object({ text: z.string() });
export type ChatResponse = z.infer<typeof ResponseSchema>;

/**
 * Stateless AI chat — no conversation history.
 * Sends a single user message and returns the assistant reply.
 */
export async function chat(
  message: string
): Promise<ChatResponse | { error: string }> {
  const input = message.trim();
  if (!input) return { error: "Message cannot be empty." };
  if (input.length > 4000) return { error: "Message is too long (max 4000 characters)." };

  let client;
  try {
    client = getOpenAIClient();
  } catch {
    return { error: "AI service is not configured. Contact the site administrator." };
  }

  try {
    const completion = await client.chat.completions.create({
      model: CHAT_MODEL,
      temperature: 0.7,
      max_tokens: 2048,
      messages: [
        {
          role: "system",
          content:
            "You are a helpful study assistant. Answer clearly and concisely. Focus on helping the student understand concepts.",
        },
        { role: "user", content: input },
      ],
    });

    const text = completion.choices[0]?.message?.content?.trim();
    if (!text) return { error: "The AI returned an empty response. Please try again." };

    return ResponseSchema.parse({ text });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message.includes("API key")) return { error: "AI service authentication failed." };
    if (message.includes("rate limit")) return { error: "Too many requests. Please wait a moment and try again." };
    if (message.includes("model")) return { error: `Model unavailable: ${CHAT_MODEL}` };
    return { error: `AI request failed: ${message}` };
  }
}
