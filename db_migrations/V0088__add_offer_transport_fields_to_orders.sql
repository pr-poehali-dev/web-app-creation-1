ALTER TABLE t_p42562714_web_app_creation_1.orders
  ADD COLUMN IF NOT EXISTS offer_category text NULL,
  ADD COLUMN IF NOT EXISTS offer_transport_service_type text NULL,
  ADD COLUMN IF NOT EXISTS offer_transport_date_time timestamp without time zone NULL;
