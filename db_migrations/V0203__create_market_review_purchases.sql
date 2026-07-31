CREATE TABLE IF NOT EXISTS market_review_purchases (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    ticker VARCHAR(50) NOT NULL,
    amount INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    tbank_order_id VARCHAR(100),
    tbank_payment_id VARCHAR(100),
    review_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_market_review_purchases_order ON market_review_purchases(tbank_order_id);
CREATE INDEX IF NOT EXISTS idx_market_review_purchases_user ON market_review_purchases(user_id);