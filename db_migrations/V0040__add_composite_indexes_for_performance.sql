-- Добавляем композитные индексы для часто используемых запросов

-- Offers: составной индекс для фильтрации по статусу + сортировке по дате
CREATE INDEX IF NOT EXISTS idx_offers_status_created_at 
ON t_p42562714_web_app_creation_1.offers (status, created_at DESC);

-- Offers: составной индекс для фильтрации по категории + статусу
CREATE INDEX IF NOT EXISTS idx_offers_category_status 
ON t_p42562714_web_app_creation_1.offers (category, status);

-- Offers: составной индекс для фильтрации по району + статусу
CREATE INDEX IF NOT EXISTS idx_offers_district_status 
ON t_p42562714_web_app_creation_1.offers (district, status);

-- Users: индекс для быстрого поиска по email (для авторизации)
CREATE INDEX IF NOT EXISTS idx_users_email 
ON t_p42562714_web_app_creation_1.users (email);

-- Order messages: составной индекс для получения сообщений заказа
CREATE INDEX IF NOT EXISTS idx_order_messages_order_created 
ON t_p42562714_web_app_creation_1.order_messages (order_id, created_at ASC);

-- Offer image relations: индекс для загрузки изображений предложения
CREATE INDEX IF NOT EXISTS idx_offer_image_relations_offer_sort 
ON t_p42562714_web_app_creation_1.offer_image_relations (offer_id, sort_order);

-- Orders: составной индекс для покупателя + статуса
CREATE INDEX IF NOT EXISTS idx_orders_buyer_status 
ON t_p42562714_web_app_creation_1.orders (buyer_id, status);

-- Orders: составной индекс для продавца + статуса
CREATE INDEX IF NOT EXISTS idx_orders_seller_status 
ON t_p42562714_web_app_creation_1.orders (seller_id, status);