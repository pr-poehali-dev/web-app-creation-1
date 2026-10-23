CREATE TABLE IF NOT EXISTS robot_rules (
    id SERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    ticker VARCHAR(20) NOT NULL,
    asset_name VARCHAR(100) NOT NULL,
    kind VARCHAR(10) NOT NULL DEFAULT 'share',
    asset_code VARCHAR(10),
    direction VARCHAR(10) NOT NULL,
    entry_conditions JSONB NOT NULL DEFAULT '[]',
    exit_conditions JSONB NOT NULL DEFAULT '[]',
    stop_atr NUMERIC(6,2) NOT NULL DEFAULT 1.5,
    target1_atr NUMERIC(6,2) NOT NULL DEFAULT 1.5,
    target2_atr NUMERIC(6,2) NOT NULL DEFAULT 3,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_by INTEGER,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_robot_rules_enabled ON robot_rules (enabled);
ALTER TABLE robot_signals ADD COLUMN IF NOT EXISTS rule_id INTEGER;