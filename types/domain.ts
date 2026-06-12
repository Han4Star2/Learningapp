export const SUBJECT_COLORS = [
  "slate",
  "blue",
  "emerald",
  "amber",
  "rose",
  "violet",
  "cyan",
  "orange",
] as const;
export type SubjectColor = (typeof SUBJECT_COLORS)[number];

export type Subject = {
  id: string;
  user_id: string;
  name: string;
  color: SubjectColor;
  created_at: string;
};

export type Teacher = {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
};

export const DOCUMENT_TYPES = ["exam", "notes", "worksheet", "textbook"] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export type StudyDocument = {
  id: string;
  user_id: string;
  subject_id: string;
  teacher_id: string | null;
  type: DocumentType;
  title: string;
  content: string | null;
  storage_path: string | null;
  created_at: string;
};

export const AI_CONTENT_TYPES = ["exam", "quiz", "flashcards"] as const;
export type AIContentType = (typeof AI_CONTENT_TYPES)[number];

export type GenerationSettings = {
  count: number;
  difficulty: "easy" | "medium" | "hard" | "mixed";
  total_marks?: number;
};

export type AIGeneratedContent = {
  id: string;
  user_id: string;
  subject_id: string;
  teacher_id: string | null;
  type: AIContentType;
  title: string;
  content_json: unknown; // narrowed via lib/ai/schemas at render time
  source_document_ids: string[];
  generation_settings?: GenerationSettings | null;
  created_at: string;
};

export type Exam = {
  id: string;
  user_id: string;
  subject_id: string;
  teacher_id: string | null;
  date_of_exam: string | null;
  file_url: string | null;
  extracted_text: string | null;
  created_at: string;
};

export type Note = {
  id: string;
  user_id: string;
  subject_id: string;
  file_url: string | null;
  extracted_text: string | null;
  note_date: string | null;
  created_at: string;
};

/** Return shape for form Server Actions used with `useActionState`. */
export type FormState = { error: string } | undefined;
