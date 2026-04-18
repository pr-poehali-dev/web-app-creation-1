CREATE TABLE IF NOT EXISTS site_visits (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(64) NOT NULL,
    user_id INTEGER NULL,
    page VARCHAR(500) NOT NULL DEFAULT '/',
    referrer VARCHAR(500) NULL,
    user_agent TEXT NULL,
    ip VARCHAR(64) NULL,
    visited_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_site_visits_visited_at ON site_visits(visited_at);
CREATE INDEX IF NOT EXISTS idx_site_visits_session_id ON site_visits(session_id);
CREATE INDEX IF NOT EXISTS idx_site_visits_user_id ON site_visits(user_id);