-- Добавляем поля для услуг в таблицу requests
ALTER TABLE t_p42562714_web_app_creation_1.requests
ADD COLUMN IF NOT EXISTS deadline TEXT,
ADD COLUMN IF NOT EXISTS deadline_start DATE,
ADD COLUMN IF NOT EXISTS deadline_end DATE,
ADD COLUMN IF NOT EXISTS negotiable_deadline BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS budget NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS negotiable_budget BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS negotiable_quantity BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS negotiable_price BOOLEAN DEFAULT false;

-- Добавляем поля для услуг в таблицу offers
ALTER TABLE t_p42562714_web_app_creation_1.offers
ADD COLUMN IF NOT EXISTS deadline TEXT,
ADD COLUMN IF NOT EXISTS deadline_start DATE,
ADD COLUMN IF NOT EXISTS deadline_end DATE,
ADD COLUMN IF NOT EXISTS negotiable_deadline BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS budget NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS negotiable_budget BOOLEAN DEFAULT false;