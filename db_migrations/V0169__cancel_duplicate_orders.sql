-- Помечаем дублирующиеся заказы как отменённые
-- buyer_id=4, offer_id=3031acee: оставляем первый (cdfa7117), дубликат уже cancelled
-- buyer_id=83, offer_id=bcdd5821: оставляем accepted (c77398e5), остальные помечаем cancelled
UPDATE orders SET status = 'cancelled' WHERE id IN ('bf49a011-86b2-44ad-b5cb-09a19d42ad87', 'bd7711ed-2af1-4159-af8f-689e1e5eeec8');
