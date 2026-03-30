-- Пересчёт reserved_quantity и sold_quantity для всех предложений
-- на основе реальных активных заказов (на случай будущих расхождений)
-- reserved = сумма количеств заказов в статусах new/pending/negotiating
-- sold = сумма количеств заказов в статусе accepted

UPDATE t_p42562714_web_app_creation_1.offers o
SET
    reserved_quantity = COALESCE((
        SELECT SUM(ord.quantity)
        FROM t_p42562714_web_app_creation_1.orders ord
        WHERE ord.offer_id = o.id
          AND ord.status IN ('new', 'pending', 'negotiating')
    ), 0),
    sold_quantity = COALESCE((
        SELECT SUM(ord.quantity)
        FROM t_p42562714_web_app_creation_1.orders ord
        WHERE ord.offer_id = o.id
          AND ord.status = 'accepted'
    ), 0);
