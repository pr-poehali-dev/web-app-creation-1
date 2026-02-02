-- Добавляем поле для главного суперадминистратора (root)
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_root_admin BOOLEAN DEFAULT FALSE;

-- Делаем doydum-invest@mail.ru главным суперадминистратором
UPDATE users 
SET role = 'superadmin', is_root_admin = TRUE 
WHERE email = 'doydum-invest@mail.ru';

-- Создаём уникальный индекс для is_root_admin = TRUE (только один может быть)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_root_admin ON users(is_root_admin) WHERE is_root_admin = TRUE;