-- Добавить колонку role если её нет
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user';

-- Обновление логина и пароля для админа (пароль: 123456)
UPDATE users 
SET password_hash = '$2b$12$FWCPaZv7U.6DqY3FMq/M5.5vZqAm6fJxLV4TLV4iMdNDZ0KDzTN6C',
    email = 'admin/ERTP',
    role = 'admin'
WHERE email = 'admin';
