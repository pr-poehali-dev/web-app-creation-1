-- Таблица настроек сайта для админ-панели
CREATE TABLE IF NOT EXISTS site_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(255) UNIQUE NOT NULL,
    setting_value TEXT,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Добавляем начальные настройки для техподдержки
INSERT INTO site_settings (setting_key, setting_value, description) 
VALUES 
    ('support_contact', 'support@example.com', 'Контакт технической поддержки (email, телефон или ссылка)'),
    ('support_type', 'email', 'Тип контакта: email, phone, telegram, whatsapp, url')
ON CONFLICT (setting_key) DO NOTHING;