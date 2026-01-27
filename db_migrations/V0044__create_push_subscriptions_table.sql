-- Создание таблицы для хранения push-подписок
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    subscription_data TEXT NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, subscription_data)
);

-- Индекс для быстрого поиска подписок пользователя
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_active ON push_subscriptions(active) WHERE active = true;

-- Комментарии
COMMENT ON TABLE push_subscriptions IS 'Push-подписки пользователей для офлайн уведомлений';
COMMENT ON COLUMN push_subscriptions.user_id IS 'ID пользователя';
COMMENT ON COLUMN push_subscriptions.subscription_data IS 'JSON с данными подписки (endpoint, keys)';
COMMENT ON COLUMN push_subscriptions.active IS 'Активна ли подписка';
