-- Добавление поля sender_name в таблицу order_messages
ALTER TABLE order_messages ADD COLUMN IF NOT EXISTS sender_name VARCHAR(255);