CREATE TABLE IF NOT EXISTS assistant_push_subscriptions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  endpoint TEXT NOT NULL UNIQUE,
  subscription_data TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_assistant_push_user ON assistant_push_subscriptions(user_id);

ALTER TABLE assistant_tasks ADD COLUMN IF NOT EXISTS tz_offset INTEGER NOT NULL DEFAULT -180;
ALTER TABLE assistant_tasks ADD COLUMN IF NOT EXISTS reminded BOOLEAN NOT NULL DEFAULT FALSE;
UPDATE assistant_tasks SET reminded = TRUE WHERE due_at IS NOT NULL AND due_at < CURRENT_TIMESTAMP;