CREATE TABLE IF NOT EXISTS t_p42562714_web_app_creation_1.subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    plan VARCHAR(20) NOT NULL CHECK (plan IN ('trial', 'week', 'month')),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
    trial_started_at TIMESTAMPTZ,
    trial_ends_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS t_p42562714_web_app_creation_1.payments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    subscription_id INTEGER,
    plan VARCHAR(20) NOT NULL CHECK (plan IN ('week', 'month')),
    amount INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
    tbank_payment_id VARCHAR(100),
    tbank_order_id VARCHAR(100) UNIQUE,
    payment_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON t_p42562714_web_app_creation_1.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON t_p42562714_web_app_creation_1.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON t_p42562714_web_app_creation_1.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_tbank_order_id ON t_p42562714_web_app_creation_1.payments(tbank_order_id);