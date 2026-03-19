CREATE TABLE IF NOT EXISTS t_p42562714_web_app_creation_1.auction_complaints (
    id SERIAL PRIMARY KEY,
    auction_id TEXT NOT NULL,
    complainant_id INTEGER NOT NULL,
    text TEXT NOT NULL,
    file_urls TEXT[] DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'new',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);