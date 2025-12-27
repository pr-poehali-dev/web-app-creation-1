-- Исправляем заказ с buyer_accepted_counter = true, но status = negotiating
UPDATE orders 
SET 
  status = 'accepted',
  price_per_unit = counter_price_per_unit,
  total_amount = counter_total_amount,
  updated_at = CURRENT_TIMESTAMP
WHERE 
  buyer_accepted_counter = true 
  AND status = 'negotiating'
  AND counter_price_per_unit IS NOT NULL
  AND counter_total_amount IS NOT NULL;