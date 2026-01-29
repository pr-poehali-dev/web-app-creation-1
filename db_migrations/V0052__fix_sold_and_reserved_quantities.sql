-- Полная синхронизация sold_quantity и reserved_quantity на основе реальных заказов

-- Сбрасываем текущие значения
UPDATE offers 
SET sold_quantity = 0, reserved_quantity = 0;

-- Пересчитываем sold_quantity на основе завершенных заказов (completed)
UPDATE offers o
SET sold_quantity = COALESCE((
    SELECT SUM(ord.quantity)
    FROM orders ord
    WHERE ord.offer_id = o.id
    AND ord.status = 'completed'
), 0);

-- Пересчитываем reserved_quantity на основе активных заказов
-- Статусы: new, pending, negotiating, accepted, in_transit
UPDATE offers o
SET reserved_quantity = COALESCE((
    SELECT SUM(ord.quantity)
    FROM orders ord
    WHERE ord.offer_id = o.id
    AND ord.status IN ('new', 'pending', 'negotiating', 'accepted', 'in_transit')
), 0);