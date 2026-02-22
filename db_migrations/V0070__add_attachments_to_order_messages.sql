ALTER TABLE t_p42562714_web_app_creation_1.order_messages
ADD COLUMN IF NOT EXISTS attachments jsonb NULL DEFAULT '[]'::jsonb;