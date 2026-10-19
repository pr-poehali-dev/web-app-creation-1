ALTER TABLE market_review_purchases ADD COLUMN IF NOT EXISTS asset_name VARCHAR(255);
ALTER TABLE market_review_purchases ADD COLUMN IF NOT EXISTS market VARCHAR(20);
UPDATE market_review_purchases SET market = 'shares' WHERE market IS NULL;