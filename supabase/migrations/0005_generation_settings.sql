-- Add generation settings tracking to ai_generated_content.
-- Stores: count, difficulty, total_marks (exam only).
-- teacher_id, source_document_ids, created_at already capture the rest.
ALTER TABLE ai_generated_content
  ADD COLUMN IF NOT EXISTS generation_settings JSONB;
