-- Создаем администратора с логином admin и паролем 123456
-- Пароль будет захеширован через bcrypt с солью

INSERT INTO users (
    email, 
    password_hash, 
    first_name, 
    last_name, 
    user_type, 
    phone, 
    role,
    created_at
) VALUES (
    'admin',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5oe2kBe7O.6K2',
    'Admin',
    'Administrator',
    'individual',
    '+79999999999',
    'admin',
    NOW()
) ON CONFLICT (email) DO NOTHING;
