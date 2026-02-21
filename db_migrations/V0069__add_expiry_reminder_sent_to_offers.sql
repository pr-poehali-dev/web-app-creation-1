ALTER TABLE t_p42562714_web_app_creation_1.offers
ADD COLUMN IF NOT EXISTS expiry_reminder_sent BOOLEAN DEFAULT FALSE;