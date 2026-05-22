CREATE TABLE IF NOT EXISTS online_presence (
  user_id integer PRIMARY KEY,
  last_seen_at timestamp with time zone NOT NULL DEFAULT now()
);
