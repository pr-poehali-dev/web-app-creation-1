-- Создание таблицы для хранения данных верификации пользователей
CREATE TABLE IF NOT EXISTS user_verifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    verification_type VARCHAR(20) NOT NULL CHECK (verification_type IN ('legal_entity', 'individual', 'self_employed')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    phone VARCHAR(20),
    phone_verified BOOLEAN DEFAULT FALSE,
    registration_address TEXT,
    actual_address TEXT,
    passport_scan_url TEXT,
    utility_bill_url TEXT,
    registration_cert_url TEXT,
    agreement_form_url TEXT,
    company_name VARCHAR(255),
    inn VARCHAR(20),
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verified_at TIMESTAMP,
    UNIQUE(user_id)
);

-- Добавление поля verification_status в таблицу users
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_status VARCHAR(20) DEFAULT 'not_verified' CHECK (verification_status IN ('not_verified', 'pending', 'verified', 'rejected'));

-- Создание индексов для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_user_verifications_user_id ON user_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_verifications_status ON user_verifications(status);
CREATE INDEX IF NOT EXISTS idx_users_verification_status ON users(verification_status);