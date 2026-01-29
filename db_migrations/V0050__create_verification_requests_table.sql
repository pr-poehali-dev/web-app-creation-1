-- Создание таблицы заявок на верификацию
CREATE TABLE IF NOT EXISTS verification_requests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    user_type VARCHAR(50) NOT NULL,
    inn VARCHAR(12) NOT NULL,
    company_name VARCHAR(500),
    ogrnip VARCHAR(15),
    ogrn VARCHAR(13),
    verified_name VARCHAR(500),
    verified_address TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    admin_comment TEXT,
    processed_by INTEGER,
    processed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_verification_requests_user_id ON verification_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_requests_status ON verification_requests(status);
CREATE INDEX IF NOT EXISTS idx_verification_requests_created_at ON verification_requests(created_at DESC);

-- Комментарии к таблице
COMMENT ON TABLE verification_requests IS 'Заявки на верификацию пользователей';
COMMENT ON COLUMN verification_requests.status IS 'Статус: pending, approved, rejected';
COMMENT ON COLUMN verification_requests.verified_name IS 'Полное название организации из ФНС';
COMMENT ON COLUMN verification_requests.verified_address IS 'Адрес организации из ФНС';
