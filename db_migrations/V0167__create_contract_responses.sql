CREATE TABLE IF NOT EXISTS contract_responses (
    id SERIAL PRIMARY KEY,
    contract_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    price_per_unit NUMERIC(15, 2),
    total_amount NUMERIC(15, 2),
    comment TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(contract_id, user_id)
);