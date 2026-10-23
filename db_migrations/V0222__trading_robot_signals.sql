CREATE TABLE IF NOT EXISTS robot_signals (
    id SERIAL PRIMARY KEY,
    ticker VARCHAR(20) NOT NULL,
    asset_name VARCHAR(100),
    timeframe VARCHAR(10) NOT NULL DEFAULT '1h',
    direction VARCHAR(10) NOT NULL,
    price NUMERIC(18,4),
    entry NUMERIC(18,4),
    stop_loss NUMERIC(18,4),
    target1 NUMERIC(18,4),
    target2 NUMERIC(18,4),
    reason TEXT,
    sent BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_robot_signals_ticker_created ON robot_signals (ticker, created_at DESC);

CREATE TABLE IF NOT EXISTS robot_watchlist (
    ticker VARCHAR(20) PRIMARY KEY,
    asset_name VARCHAR(100) NOT NULL,
    kind VARCHAR(10) NOT NULL DEFAULT 'share',
    asset_code VARCHAR(10),
    enabled BOOLEAN NOT NULL DEFAULT TRUE
);

INSERT INTO robot_watchlist (ticker, asset_name, kind, asset_code) VALUES
    ('ALRS', 'АЛРОСА', 'share', NULL),
    ('VTBR', 'Банк ВТБ', 'share', NULL),
    ('BR', 'Нефть Brent', 'future', 'BR')
ON CONFLICT (ticker) DO NOTHING;
