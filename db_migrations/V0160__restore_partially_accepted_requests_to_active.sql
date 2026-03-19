-- Возвращаем запросы в статус 'active' если принятое количество < запрошенного
UPDATE t_p42562714_web_app_creation_1.requests
SET status = 'active', updated_at = NOW()
WHERE status = 'closed'
  AND COALESCE((
      SELECT SUM(o.quantity)
      FROM t_p42562714_web_app_creation_1.orders o
      WHERE o.offer_id = requests.id
        AND o.status = 'accepted'
  ), 0) < requests.quantity;