ALTER TABLE game_chat_messages ADD COLUMN IF NOT EXISTS media_url TEXT;
ALTER TABLE game_chat_messages ADD COLUMN IF NOT EXISTS media_type VARCHAR(10);
ALTER TABLE game_users ADD COLUMN IF NOT EXISTS avatar_url TEXT;