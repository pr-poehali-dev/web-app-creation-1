ALTER TABLE t_p42562714_web_app_creation_1.orders ADD COLUMN IF NOT EXISTS admin_archive_reason TEXT;
ALTER TABLE t_p42562714_web_app_creation_1.orders ADD COLUMN IF NOT EXISTS archived_by_admin BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE t_p42562714_web_app_creation_1.orders ADD COLUMN IF NOT EXISTS admin_archived_at TIMESTAMP;