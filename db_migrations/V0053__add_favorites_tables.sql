-- Создаем таблицу для избранных предложений
CREATE TABLE IF NOT EXISTS t_p42562714_web_app_creation_1.offer_favorites (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    offer_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, offer_id)
);

-- Создаем индекс для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_offer_favorites_user_id ON t_p42562714_web_app_creation_1.offer_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_offer_favorites_offer_id ON t_p42562714_web_app_creation_1.offer_favorites(offer_id);

-- Аналогичная таблица для запросов
CREATE TABLE IF NOT EXISTS t_p42562714_web_app_creation_1.request_favorites (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    request_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, request_id)
);

CREATE INDEX IF NOT EXISTS idx_request_favorites_user_id ON t_p42562714_web_app_creation_1.request_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_request_favorites_request_id ON t_p42562714_web_app_creation_1.request_favorites(request_id);