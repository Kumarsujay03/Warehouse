-- Many-to-many relationship: posts <-> resources
CREATE TABLE IF NOT EXISTS post_resources (
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, resource_id)
);

CREATE INDEX idx_post_resources_resource_id ON post_resources(resource_id);

-- Enable RLS
ALTER TABLE post_resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access" ON post_resources FOR ALL TO public USING (true) WITH CHECK (true);

-- Grant permissions
GRANT ALL ON post_resources TO service_role;
GRANT ALL ON post_resources TO authenticated;
GRANT ALL ON post_resources TO anon;

-- Migrate existing resource_id links from posts table into post_resources
INSERT INTO post_resources (post_id, resource_id, is_primary)
SELECT id, resource_id, true
FROM posts
WHERE resource_id IS NOT NULL
ON CONFLICT DO NOTHING;
