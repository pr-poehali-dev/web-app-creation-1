CREATE TABLE IF NOT EXISTS t_p42562714_web_app_creation_1.auction_contacts (
    id SERIAL PRIMARY KEY,
    auction_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('winner', 'seller')),
    phone TEXT NOT NULL,
    email TEXT,
    address TEXT,
    preferred_time TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(auction_id, role)
);