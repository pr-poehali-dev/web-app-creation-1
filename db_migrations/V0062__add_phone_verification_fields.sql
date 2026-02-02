-- Добавляем поля для верификации телефона
ALTER TABLE t_p42562714_web_app_creation_1.users
ADD COLUMN IF NOT EXISTS phone_verification_token VARCHAR(64),
ADD COLUMN IF NOT EXISTS phone_verification_expires TIMESTAMP,
ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE;

-- Индекс для быстрого поиска по токену
CREATE INDEX IF NOT EXISTS idx_users_phone_verification_token 
ON t_p42562714_web_app_creation_1.users(phone_verification_token);

-- Создаём таблицу для хранения настроек Telegram бота
CREATE TABLE IF NOT EXISTS t_p42562714_web_app_creation_1.telegram_bot_settings (
    id SERIAL PRIMARY KEY,
    bot_token VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Вставляем первую запись для настроек
INSERT INTO t_p42562714_web_app_creation_1.telegram_bot_settings (bot_token, is_active)
VALUES ('', FALSE)
ON CONFLICT DO NOTHING;