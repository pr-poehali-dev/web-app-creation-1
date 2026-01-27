-- Добавляем колонку для хранения Telegram chat_id пользователя
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS telegram_chat_id BIGINT;

-- Создаём индекс для быстрого поиска по telegram_chat_id
CREATE INDEX IF NOT EXISTS idx_users_telegram_chat_id 
ON users(telegram_chat_id) 
WHERE telegram_chat_id IS NOT NULL;

COMMENT ON COLUMN users.telegram_chat_id IS 'Telegram chat ID пользователя для отправки уведомлений';
