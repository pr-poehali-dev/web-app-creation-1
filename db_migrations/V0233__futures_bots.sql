CREATE TABLE IF NOT EXISTS t_p42562714_web_app_creation_1.futures_bots (
  id SERIAL PRIMARY KEY,
  bot_type VARCHAR(20) NOT NULL,
  name VARCHAR(100) NOT NULL,
  asset_code VARCHAR(10) NOT NULL,
  mode VARCHAR(10) NOT NULL DEFAULT 'off',
  settings TEXT,
  armed_at TIMESTAMP,
  last_run_at TIMESTAMP,
  last_status TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS t_p42562714_web_app_creation_1.futures_bot_log (
  id SERIAL PRIMARY KEY,
  bot_id INTEGER NOT NULL,
  kind VARCHAR(20) NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_futures_bot_log_bot ON t_p42562714_web_app_creation_1.futures_bot_log (bot_id, id DESC);

CREATE TABLE IF NOT EXISTS t_p42562714_web_app_creation_1.futures_news_events (
  id SERIAL PRIMARY KEY,
  event_time TIMESTAMP NOT NULL,
  title VARCHAR(200) NOT NULL,
  importance SMALLINT NOT NULL DEFAULT 2,
  repeat_weekly BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

ALTER TABLE t_p42562714_web_app_creation_1.robot_signals ADD COLUMN IF NOT EXISTS bot_id INTEGER;
ALTER TABLE t_p42562714_web_app_creation_1.robot_signals ADD COLUMN IF NOT EXISTS bot_mode VARCHAR(10);
ALTER TABLE t_p42562714_web_app_creation_1.robot_signals ADD COLUMN IF NOT EXISTS signal_key VARCHAR(60);
ALTER TABLE t_p42562714_web_app_creation_1.robot_signals ADD COLUMN IF NOT EXISTS bot_state TEXT;
ALTER TABLE t_p42562714_web_app_creation_1.robot_signals ADD COLUMN IF NOT EXISTS contracts INTEGER;
CREATE INDEX IF NOT EXISTS idx_robot_signals_bot ON t_p42562714_web_app_creation_1.robot_signals (bot_id, signal_key);