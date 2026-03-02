CREATE TABLE IF NOT EXISTS t_p42562714_web_app_creation_1.short_urls (
  id SERIAL PRIMARY KEY,
  code VARCHAR(10) UNIQUE NOT NULL,
  original_url TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  hits INTEGER DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_short_urls_code ON t_p42562714_web_app_creation_1.short_urls(code);