ALTER TABLE t_p42562714_web_app_creation_1.offers
ADD COLUMN IF NOT EXISTS transport_waypoints JSONB DEFAULT '[]'::jsonb;

ALTER TABLE t_p42562714_web_app_creation_1.orders
ADD COLUMN IF NOT EXISTS passenger_pickup_address TEXT;
