ALTER TABLE t_p42562714_web_app_creation_1.requests
  ADD COLUMN IF NOT EXISTS transport_service_type VARCHAR(100),
  ADD COLUMN IF NOT EXISTS transport_route VARCHAR(500),
  ADD COLUMN IF NOT EXISTS transport_type VARCHAR(100),
  ADD COLUMN IF NOT EXISTS transport_capacity VARCHAR(100),
  ADD COLUMN IF NOT EXISTS transport_date_time TIMESTAMP,
  ADD COLUMN IF NOT EXISTS transport_price NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS transport_price_type VARCHAR(50),
  ADD COLUMN IF NOT EXISTS transport_negotiable BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS transport_comment TEXT,
  ADD COLUMN IF NOT EXISTS transport_all_districts BOOLEAN DEFAULT FALSE;