-- Добавление полей для работы с заказами и ответами продавца
ALTER TABLE t_p42562714_web_app_creation_1.reviews 
ADD COLUMN IF NOT EXISTS order_id UUID,
ADD COLUMN IF NOT EXISTS seller_response TEXT,
ADD COLUMN IF NOT EXISTS seller_response_date TIMESTAMP;

-- Создание индекса для order_id
CREATE INDEX IF NOT EXISTS idx_reviews_order_id ON t_p42562714_web_app_creation_1.reviews(order_id);