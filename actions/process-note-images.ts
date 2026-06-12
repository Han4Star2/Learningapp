"use server";

import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { getOpenAIClient, CHAT_MODEL } from "@/lib/openai/client";
import { DOCUMENTS_BUCKET } from "@/lib/storage";
import { createNote } from "@/actions/notes";

const ExtractSchema = z.object({
  extracted_text: z.string(),
});

export async function processAndSaveNote(input: {
  subjectId: string;
  noteDate?: string | null;
  path: string;
}): Promise<{ id: string } | { error: string }> {
  if (!input.subjectId) return { error: "Subject is required." };
  if (!input.path) return { error: "No file provided." };

  const { supabase } = await requireUser();

  let extractedText = "";

  try {
    const { data: signedData, error: signedError } = await supabase.storage
      .from(DOCUMENTS_BUCKET)
      .createSignedUrl(input.path, 300);

    if (!signedError && signedData) {
      const client = getOpenAIClient();

      const completion = await client.chat.completions.create({
        model: CHAT_MODEL,
        temperature: 0,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "note_extract",
            strict: true,
            schema: {
              type: "object",
              properties: {
                extracted_text: {
                  type: "string",
                  description:
                    "All handwritten and printed text from the notebook page, preserving structure and layout as closely as possible.",
                },
              },
              required: ["extracted_text"],
              additionalProperties: false,
            },
          },
        },
        messages: [
          {
            role: "system",
            content:
              "You are an OCR assistant. Extract all text from study notes and notebook pages, preserving headings, lists, and structure.",
          },
          {
            role: "user",
            content: [
              {
                type: "image_url" as const,
                image_url: {
                  url: signedData.signedUrl,
                  detail: "high" as const,
                },
              },
              {
                type: "text" as const,
                text: "Extract all text visible in this notebook or study note image.",
              },
            ],
          },
        ],
      });

      const raw = completion.choices[0]?.message?.content ?? null;
      if (raw) {
        const parsed = ExtractSchema.safeParse(JSON.parse(raw));
        if (parsed.success) {
          extractedText = parsed.data.extracted_text;
        }
      }
    }
  } catch {
    // Vision unavailable — save without extraction
  }

  return createNote({
    subjectId: input.subjectId,
    noteDate: input.noteDate,
    filePath: input.path,
    extractedText: extractedText || undefined,
  });
}
