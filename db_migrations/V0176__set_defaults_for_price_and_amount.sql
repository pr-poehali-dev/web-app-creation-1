ALTER TABLE contracts ALTER COLUMN price_per_unit SET DEFAULT 0;
ALTER TABLE contracts ALTER COLUMN total_amount SET DEFAULT 0;
UPDATE contracts SET price_per_unit = 0 WHERE price_per_unit IS NULL;
UPDATE contracts SET total_amount = 0 WHERE total_amount IS NULL;