-- Удаляем старый constraint на статус заказа
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;

-- Добавляем новый constraint с расширенным списком статусов
ALTER TABLE orders ADD CONSTRAINT orders_status_check 
  CHECK (status IN ('new', 'pending', 'negotiating', 'accepted', 'rejected', 'processing', 'shipping', 'completed', 'cancelled'));