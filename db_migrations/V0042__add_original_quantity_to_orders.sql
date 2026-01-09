-- Добавляем колонку original_quantity для хранения исходного количества заказа
ALTER TABLE t_p42562714_web_app_creation_1.orders ADD COLUMN IF NOT EXISTS original_quantity INTEGER;

-- Заполняем original_quantity текущим значением quantity для существующих заказов
UPDATE t_p42562714_web_app_creation_1.orders 
SET original_quantity = quantity 
WHERE original_quantity IS NULL;