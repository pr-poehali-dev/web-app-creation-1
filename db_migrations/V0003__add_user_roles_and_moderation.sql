-- Добавление поля role в таблицу users для разграничения прав доступа
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'admin'));

-- Создание индекса для быстрого поиска модераторов
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Обновление таблицы user_verifications для хранения информации о модераторе
ALTER TABLE user_verifications ADD COLUMN IF NOT EXISTS reviewed_by INTEGER REFERENCES users(id);
ALTER TABLE user_verifications ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP;