-- Добавление поля для хранения страницы паспорта с регистрацией
ALTER TABLE user_verifications ADD COLUMN IF NOT EXISTS passport_registration_url TEXT;