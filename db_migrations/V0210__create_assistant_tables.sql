CREATE TABLE IF NOT EXISTS assistant_users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(30) NOT NULL,
  name_lower VARCHAR(30) NOT NULL UNIQUE,
  pin_hash VARCHAR(255) NOT NULL,
  modes TEXT NOT NULL DEFAULT '',
  about TEXT NOT NULL DEFAULT '',
  failed_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP NULL
);

CREATE TABLE IF NOT EXISTS assistant_memory (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  fact TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_assistant_memory_user ON assistant_memory(user_id);

CREATE TABLE IF NOT EXISTS assistant_messages (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  role VARCHAR(10) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_assistant_messages_user ON assistant_messages(user_id, id);

CREATE TABLE IF NOT EXISTS assistant_tasks (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  title VARCHAR(200) NOT NULL,
  due_at TIMESTAMP NULL,
  done BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_assistant_tasks_user ON assistant_tasks(user_id, done);