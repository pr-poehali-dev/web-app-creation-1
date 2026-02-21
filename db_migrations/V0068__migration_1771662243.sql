UPDATE t_p42562714_web_app_creation_1.offers
SET expiry_date = created_at + INTERVAL '30 days',
    updated_at = NOW()
WHERE expiry_date IS NULL
  AND status = 'active';

UPDATE t_p42562714_web_app_creation_1.requests
SET expiry_date = created_at + INTERVAL '30 days',
    updated_at = NOW()
WHERE expiry_date IS NULL
  AND status = 'active';