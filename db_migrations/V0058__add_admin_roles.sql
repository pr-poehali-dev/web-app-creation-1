-- Добавляем новые роли администраторов
-- Роли: user, moderator, admin, superadmin

-- Удаляем старое ограничение на роли
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Добавляем новое ограничение с расширенным списком ролей
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('user', 'moderator', 'admin', 'superadmin'));

-- Обновляем существующих администраторов до superadmin (для обратной совместимости)
UPDATE users 
SET role = 'superadmin' 
WHERE role = 'admin';

-- Создаём таблицу для логирования действий администраторов
CREATE TABLE IF NOT EXISTS admin_actions_log (
    id SERIAL PRIMARY KEY,
    admin_id INTEGER NOT NULL REFERENCES users(id),
    action_type VARCHAR(100) NOT NULL,
    target_user_id INTEGER REFERENCES users(id),
    details JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индекс для быстрого поиска действий
CREATE INDEX IF NOT EXISTS idx_admin_actions_admin_id ON admin_actions_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_created_at ON admin_actions_log(created_at DESC);