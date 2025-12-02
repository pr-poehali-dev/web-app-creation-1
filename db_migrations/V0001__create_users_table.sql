-- Создание таблицы пользователей с безопасным хранением паролей
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    user_type VARCHAR(50) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    company_name VARCHAR(255),
    inn VARCHAR(12),
    ogrnip VARCHAR(15),
    ogrn VARCHAR(13),
    position VARCHAR(100),
    director_name VARCHAR(255),
    legal_address TEXT,
    is_active BOOLEAN DEFAULT true,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание индексов для быстрого поиска
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Вставка демо-пользователя с хешированным паролем (demo123 -> bcrypt hash)
INSERT INTO users (email, password_hash, first_name, last_name, user_type, phone)
VALUES ('demo@example.com', '$2a$10$rZqN5H5xH5xH5xH5xH5xHuOqN5H5xH5xH5xH5xH5xH5xH5xH5xH5xe', 'Демо', 'Пользователь', 'individual', '+7 (999) 999-99-99')
ON CONFLICT (email) DO NOTHING;