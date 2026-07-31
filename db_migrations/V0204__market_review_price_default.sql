INSERT INTO site_settings (setting_key, setting_value)
VALUES ('market_review_price_kopeks', '1500')
ON CONFLICT (setting_key) DO NOTHING;