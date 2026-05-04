-- Feedback / bug-report system
-- Users can submit bug reports and suggestions; admins see everything in inbox

CREATE TABLE IF NOT EXISTS feedback (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type        text        NOT NULL CHECK (type IN ('bug', 'suggestion', 'other')),
  message     text        NOT NULL CHECK (char_length(message) >= 5),
  status      text        NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'resolved')),
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Users can insert their own feedback
CREATE POLICY "users_insert_own_feedback"
  ON feedback FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can see their own feedback
CREATE POLICY "users_select_own_feedback"
  ON feedback FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Admins can do everything
CREATE POLICY "admin_all_feedback"
  ON feedback FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
    )
  );

-- Index for admin inbox (ordered by created_at)
CREATE INDEX IF NOT EXISTS feedback_created_at_idx ON feedback(created_at DESC);
