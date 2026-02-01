
-- Очищаем дубликаты телефонов: оставляем самый старый аккаунт, остальные помечаем как удалённые
WITH duplicates AS (
  SELECT id, phone, 
         ROW_NUMBER() OVER (PARTITION BY phone ORDER BY created_at ASC) as rn
  FROM t_p42562714_web_app_creation_1.users
  WHERE removed_at IS NULL
)
UPDATE t_p42562714_web_app_creation_1.users
SET removed_at = NOW()
WHERE id IN (SELECT id FROM duplicates WHERE rn > 1);

-- Очищаем дубликаты ИНН: оставляем самый старый аккаунт
WITH duplicates AS (
  SELECT id, inn,
         ROW_NUMBER() OVER (PARTITION BY inn ORDER BY created_at ASC) as rn
  FROM t_p42562714_web_app_creation_1.users
  WHERE removed_at IS NULL AND inn IS NOT NULL AND inn != ''
)
UPDATE t_p42562714_web_app_creation_1.users
SET removed_at = NOW()
WHERE id IN (SELECT id FROM duplicates WHERE rn > 1);

-- Теперь добавляем уникальные индексы
CREATE UNIQUE INDEX idx_users_phone_unique ON t_p42562714_web_app_creation_1.users(phone) WHERE removed_at IS NULL;
CREATE UNIQUE INDEX idx_users_inn_unique ON t_p42562714_web_app_creation_1.users(inn) WHERE removed_at IS NULL AND inn IS NOT NULL AND inn != '';

-- Добавляем поля для подтверждения email и восстановления пароля
ALTER TABLE t_p42562714_web_app_creation_1.users 
  ADD COLUMN email_verified BOOLEAN DEFAULT FALSE,
  ADD COLUMN email_verification_token VARCHAR(64),
  ADD COLUMN email_verification_expires TIMESTAMP,
  ADD COLUMN password_reset_token VARCHAR(64),
  ADD COLUMN password_reset_expires TIMESTAMP;

-- Индексы для быстрого поиска по токенам
CREATE INDEX idx_users_email_verification_token ON t_p42562714_web_app_creation_1.users(email_verification_token);
CREATE INDEX idx_users_password_reset_token ON t_p42562714_web_app_creation_1.users(password_reset_token);
