-- Добавляем поле для включения/отключения email-уведомлений
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT true;

-- Добавляем комментарий к полю
COMMENT ON COLUMN users.email_notifications IS 'Включены ли email-уведомления для пользователя';
