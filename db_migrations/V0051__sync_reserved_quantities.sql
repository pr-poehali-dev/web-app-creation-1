-- Синхронизация reserved_quantity на основе активных заказов
-- Для каждого предложения пересчитываем зарезервированное количество

UPDATE offers o
SET reserved_quantity = COALESCE((
    SELECT SUM(ord.quantity)
    FROM orders ord
    WHERE ord.offer_id = o.id
    AND ord.status IN ('new', 'pending', 'negotiating', 'accepted', 'in_transit')
), 0);