CREATE TABLE IF NOT EXISTS t_p42562714_web_app_creation_1.market_fundamentals_cache (
    ticker VARCHAR(32) PRIMARY KEY,
    report_text TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);