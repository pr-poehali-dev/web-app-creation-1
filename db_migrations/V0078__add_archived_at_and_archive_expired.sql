ALTER TABLE t_p42562714_web_app_creation_1.requests
  ADD COLUMN IF NOT EXISTS archived_at timestamp without time zone NULL;

ALTER TABLE t_p42562714_web_app_creation_1.offers
  ADD COLUMN IF NOT EXISTS archived_at timestamp without time zone NULL;

ALTER TABLE t_p42562714_web_app_creation_1.orders
  ADD COLUMN IF NOT EXISTS archived_at timestamp without time zone NULL;

UPDATE t_p42562714_web_app_creation_1.requests
  SET status = 'archived', archived_at = CURRENT_TIMESTAMP
  WHERE status = 'active'
    AND expiry_date IS NOT NULL
    AND expiry_date < CURRENT_TIMESTAMP;

UPDATE t_p42562714_web_app_creation_1.offers
  SET status = 'archived', archived_at = CURRENT_TIMESTAMP
  WHERE status = 'active'
    AND expiry_date IS NOT NULL
    AND expiry_date < CURRENT_TIMESTAMP;
