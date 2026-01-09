-- Добавляем колонку cancelled_by для отслеживания кто отменил заказ
ALTER TABLE t_p42562714_web_app_creation_1.orders ADD COLUMN IF NOT EXISTS cancelled_by VARCHAR(10) CHECK (cancelled_by IN ('buyer', 'seller'));

-- Добавляем колонку rating для рейтинга пользователей (если её нет)
ALTER TABLE t_p42562714_web_app_creation_1.users ADD COLUMN IF NOT EXISTS rating NUMERIC(5,2) DEFAULT 100.00 CHECK (rating >= 0 AND rating <= 100);

-- Индекс для быстрого поиска отменённых заказов
CREATE INDEX IF NOT EXISTS idx_orders_cancelled ON t_p42562714_web_app_creation_1.orders(cancelled_by) WHERE cancelled_by IS NOT NULL;