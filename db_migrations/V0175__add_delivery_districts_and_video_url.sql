ALTER TABLE contracts ADD COLUMN IF NOT EXISTS delivery_districts JSONB;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS product_video_url TEXT;