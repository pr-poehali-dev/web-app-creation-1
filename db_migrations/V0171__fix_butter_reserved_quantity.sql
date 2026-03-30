-- Исправляем зависшие reserved_quantity для "Сливочная масло"
-- Два отменённых дубля (bd7711ed, bf49a011) не вернули reserved_quantity обратно
-- Принятый заказ (c77398e5): sold=5, reserved=0
-- Итого должно быть: sold_quantity=5, reserved_quantity=0
UPDATE t_p42562714_web_app_creation_1.offers
SET reserved_quantity = 0
WHERE id = 'bcdd5821-6eb6-4c04-8f5a-6614c3937ec9';
