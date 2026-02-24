ALTER TABLE t_p42562714_web_app_creation_1.offers
ADD COLUMN IF NOT EXISTS transport_service_type TEXT,
ADD COLUMN IF NOT EXISTS transport_route TEXT,
ADD COLUMN IF NOT EXISTS transport_type TEXT,
ADD COLUMN IF NOT EXISTS transport_capacity TEXT,
ADD COLUMN IF NOT EXISTS transport_date_time TEXT,
ADD COLUMN IF NOT EXISTS transport_price NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS transport_price_type TEXT,
ADD COLUMN IF NOT EXISTS transport_negotiable BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS transport_comment TEXT;