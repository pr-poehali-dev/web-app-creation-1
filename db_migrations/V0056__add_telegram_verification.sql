-- Добавление полей для Telegram подтверждения
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS telegram_chat_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS telegram_username VARCHAR(255),
ADD COLUMN IF NOT EXISTS telegram_verified BOOLEAN DEFAULT FALSE;

-- Таблица для кодов привязки Telegram
CREATE TABLE IF NOT EXISTS telegram_link_codes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    code VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_telegram_link_codes_code ON telegram_link_codes(code);
CREATE INDEX IF NOT EXISTS idx_telegram_link_codes_user_id ON telegram_link_codes(user_id);

-- Таблица для кодов подтверждения через Telegram
CREATE TABLE IF NOT EXISTS telegram_verification_codes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    code VARCHAR(10) NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_telegram_verification_codes_code ON telegram_verification_codes(code);
CREATE INDEX IF NOT EXISTS idx_telegram_verification_codes_user_id ON telegram_verification_codes(user_id);
