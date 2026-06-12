-- AI-generated images table
CREATE TABLE IF NOT EXISTS ai_images (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt      TEXT        NOT NULL,
  style       TEXT,
  image_url   TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Row-level security: users can only access their own images
ALTER TABLE ai_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own images"
  ON ai_images FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Index for fast user-scoped queries
CREATE INDEX IF NOT EXISTS ai_images_user_id_idx ON ai_images (user_id, created_at DESC);
