-- Добавляем timestamp для маркировки удаленных пользователей
ALTER TABLE t_p42562714_web_app_creation_1.users 
ADD COLUMN IF NOT EXISTS removed_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NULL;

COMMENT ON COLUMN t_p42562714_web_app_creation_1.users.removed_at IS 'Timestamp когда пользователь был удален (soft removal)';