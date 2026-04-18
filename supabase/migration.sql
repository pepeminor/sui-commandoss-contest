-- Run this in Supabase SQL Editor to create the comments table
-- Dashboard: https://supabase.com/dashboard -> SQL Editor

CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id TEXT NOT NULL,
  address TEXT NOT NULL,
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 500),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Index for fast lookups by post
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments (post_id, created_at DESC);

-- Rate limiting index (1 comment per address per 10 seconds)
CREATE INDEX IF NOT EXISTS idx_comments_address_time ON comments (address, created_at DESC);

-- Row Level Security
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Anyone can read comments
CREATE POLICY "Comments are publicly readable"
  ON comments FOR SELECT
  USING (true);

-- Insert with server-side validation mirrored in RLS
CREATE POLICY "Validated inserts only"
  ON comments FOR INSERT
  WITH CHECK (
    char_length(content) BETWEEN 1 AND 500
    AND address ~ '^0x[a-fA-F0-9]{64}$'
    AND post_id ~ '^0x[a-fA-F0-9]{64}$'
  );

-- Only the comment author can delete their own comment
CREATE POLICY "Users can delete own comments"
  ON comments FOR DELETE
  USING (false); -- Disable delete for now, enable later with auth
