-- Добавляем колонку min_order_quantity в таблицу offers
ALTER TABLE t_p42562714_web_app_creation_1.offers 
ADD COLUMN IF NOT EXISTS min_order_quantity INTEGER;

-- Комментарий для документации
COMMENT ON COLUMN t_p42562714_web_app_creation_1.offers.min_order_quantity 
IS 'Минимальное количество для заказа. Если NULL - нет минимума.';