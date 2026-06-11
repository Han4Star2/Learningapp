import type { StudyDocument } from "@/types/domain";

/**
 * Context assembly for the two AI layers.
 * MVP retrieval = concatenate all relevant document text under a character
 * budget (chars ≈ tokens × 4). Later this swaps to vector retrieval over
 * document_chunks without changing callers.
 */

const PER_DOC_LIMIT = 40_000; // chars per document
const CONTENT_BUDGET = 400_000; // chars for the CONTENT layer
const STYLE_BUDGET = 200_000; // chars for the STYLE layer

function renderDocs(docs: StudyDocument[], budget: number): string {
  const parts: string[] = [];
  let used = 0;
  for (const doc of docs) {
    const text = (doc.content ?? "").trim();
    if (!text) continue;
    const trimmed =
      text.length > PER_DOC_LIMIT
        ? text.slice(0, PER_DOC_LIMIT) + "\n[…truncated…]"
        : text;
    if (used + trimmed.length > budget) break;
    used += trimmed.length;
    parts.push(`## [${doc.type}] ${doc.title}\n${trimmed}`);
  }
  return parts.join("\n\n");
}

/** Builds the single structured user message merging both layers. */
export function buildFrame(args: {
  subjectName: string;
  contentDocs: StudyDocument[];
  styleDocs: StudyDocument[];
  task: string;
}): string {
  const { subjectName, contentDocs, styleDocs, task } = args;

  const content = renderDocs(contentDocs, CONTENT_BUDGET);
  const style = renderDocs(styleDocs, STYLE_BUDGET);

  return [
    "# SUBJECT CONTENT  (defines WHAT to assess — use ONLY this for facts and topics)",
    `Subject: ${subjectName}`,
    content || "(no documents provided)",
    "",
    "# TEACHER STYLE  (defines HOW to ask — imitate phrasing, structure, mark allocation, difficulty mix)",
    style ||
      "No teacher style provided; use a clear, conventional style for this kind of material.",
    "",
    "# TASK",
    task,
  ].join("\n");
}
