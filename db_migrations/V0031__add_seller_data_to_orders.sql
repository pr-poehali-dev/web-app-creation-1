-- Добавляем данные продавца в таблицу orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS seller_name TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS seller_phone TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS seller_email TEXT;

-- Обновляем существующие заказы - подтягиваем данные продавца из offers
UPDATE orders o
SET 
  seller_name = COALESCE(
    (SELECT first_name || ' ' || last_name FROM users u WHERE u.id = o.seller_id),
    'Продавец'
  ),
  seller_phone = (SELECT phone FROM users u WHERE u.id = o.seller_id),
  seller_email = (SELECT email FROM users u WHERE u.id = o.seller_id)
WHERE seller_name IS NULL;