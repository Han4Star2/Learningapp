"use server";

import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { getOpenAIClient, CHAT_MODEL } from "@/lib/openai/client";
import { DOCUMENTS_BUCKET } from "@/lib/storage";
import { createExam } from "@/actions/exams";

const ExtractSchema = z.object({
  extracted_text: z.string(),
  detected_date: z.string(), // "YYYY-MM-DD" or "" if not found
});

export async function processAndSaveExam(input: {
  subjectId: string;
  teacherId?: string | null;
  dateOfExam?: string | null;
  paths: string[]; // Supabase storage paths, one per page
}): Promise<
  | { id: string; detectedDate: string | null; dateMismatch: boolean }
  | { error: string }
> {
  if (!input.subjectId) return { error: "Subject is required." };
  if (input.paths.length === 0) return { error: "No files provided." };

  const { supabase } = await requireUser();

  // Generate short-lived signed URLs so OpenAI can fetch the images
  const signedUrls: string[] = [];
  for (const path of input.paths) {
    const { data, error } = await supabase.storage
      .from(DOCUMENTS_BUCKET)
      .createSignedUrl(path, 300);
    if (error || !data) return { error: "Could not access uploaded images." };
    signedUrls.push(data.signedUrl);
  }

  let extractedText = "";
  let detectedDate: string | null = null;

  try {
    const client = getOpenAIClient();

    const imageContent = signedUrls.map((url) => ({
      type: "image_url" as const,
      image_url: { url, detail: "high" as const },
    }));

    const completion = await client.chat.completions.create({
      model: CHAT_MODEL,
      temperature: 0,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "exam_extract",
          strict: true,
          schema: {
            type: "object",
            properties: {
              extracted_text: {
                type: "string",
                description: "All text from the exam pages, preserving structure.",
              },
              detected_date: {
                type: "string",
                description:
                  "The exam date in YYYY-MM-DD format. Return empty string if no date found.",
              },
            },
            required: ["extracted_text", "detected_date"],
            additionalProperties: false,
          },
        },
      },
      messages: [
        {
          role: "system",
          content:
            "You are an OCR assistant for exam papers. Extract all text and identify the exam date (look in headers, footers, or date fields). Normalize the date to YYYY-MM-DD format.",
        },
        {
          role: "user",
          content: [
            ...imageContent,
            {
              type: "text" as const,
              text: "Extract all text from these exam pages. Identify the exam date if visible (e.g. '15.03.2024', 'November 2024', 'Date: 2024-11-15'). Return empty string for detected_date if not found.",
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
        detectedDate = parsed.data.detected_date || null;
      }
    }
  } catch {
    // Vision unavailable — save without extraction
  }

  const saved = await createExam({
    subjectId: input.subjectId,
    teacherId: input.teacherId,
    dateOfExam: input.dateOfExam,
    filePath: input.paths[0],
    extractedText: extractedText || undefined,
  });
  if ("error" in saved) return saved;

  const dateMismatch =
    !!detectedDate &&
    !!input.dateOfExam &&
    detectedDate !== input.dateOfExam;

  return { id: saved.id, detectedDate, dateMismatch };
}
