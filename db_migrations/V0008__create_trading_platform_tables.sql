-- Таблица для торговых контрактов (фьючерсы и форварды)
CREATE TABLE contracts (
    id SERIAL PRIMARY KEY,
    contract_type VARCHAR(20) NOT NULL CHECK (contract_type IN ('futures', 'forward')),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    
    -- Информация о товаре/услуге
    product_name VARCHAR(255) NOT NULL,
    product_specs JSONB,
    quantity DECIMAL(15, 3) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    
    -- Финансовые условия
    price_per_unit DECIMAL(15, 2) NOT NULL,
    total_amount DECIMAL(15, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'RUB',
    
    -- Даты и сроки
    delivery_date DATE NOT NULL,
    contract_start_date DATE NOT NULL,
    contract_end_date DATE NOT NULL,
    
    -- Участники контракта
    seller_id INTEGER REFERENCES users(id),
    buyer_id INTEGER,
    
    -- Статусы
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled')),
    
    -- Логистика
    delivery_address TEXT,
    delivery_method VARCHAR(100),
    logistics_partner_id INTEGER,
    
    -- Финансирование
    prepayment_percent DECIMAL(5, 2) DEFAULT 0,
    prepayment_amount DECIMAL(15, 2) DEFAULT 0,
    financing_available BOOLEAN DEFAULT false,
    
    -- Дополнительно
    terms_conditions TEXT,
    min_purchase_quantity DECIMAL(15, 3),
    discount_percent DECIMAL(5, 2) DEFAULT 0,
    
    -- Метаданные
    views_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица для отзывов и рейтингов
CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    contract_id INTEGER REFERENCES contracts(id),
    reviewer_id INTEGER REFERENCES users(id),
    reviewed_user_id INTEGER REFERENCES users(id),
    
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255),
    comment TEXT,
    
    -- Критерии оценки
    quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
    delivery_rating INTEGER CHECK (delivery_rating >= 1 AND delivery_rating <= 5),
    communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
    
    is_verified_purchase BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(contract_id, reviewer_id)
);

-- Таблица для логистических партнеров
CREATE TABLE logistics_partners (
    id SERIAL PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    type VARCHAR(50) CHECK (type IN ('local', 'federal', 'international')),
    
    contact_person VARCHAR(255),
    phone VARCHAR(20),
    email VARCHAR(255),
    
    service_areas JSONB,
    transport_types JSONB,
    
    rating DECIMAL(3, 2) DEFAULT 0,
    reviews_count INTEGER DEFAULT 0,
    
    price_per_km DECIMAL(10, 2),
    min_order_amount DECIMAL(15, 2),
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица для отслеживания доставок
CREATE TABLE deliveries (
    id SERIAL PRIMARY KEY,
    contract_id INTEGER REFERENCES contracts(id),
    logistics_partner_id INTEGER REFERENCES logistics_partners(id),
    
    tracking_number VARCHAR(100) UNIQUE,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'picked_up', 'in_transit', 'delivered', 'cancelled')),
    
    pickup_address TEXT,
    delivery_address TEXT,
    
    estimated_delivery_date DATE,
    actual_delivery_date DATE,
    
    cost DECIMAL(15, 2),
    
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица для аналитики и статистики
CREATE TABLE market_analytics (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    category VARCHAR(100),
    
    -- Метрики спроса
    total_views INTEGER DEFAULT 0,
    total_inquiries INTEGER DEFAULT 0,
    total_contracts INTEGER DEFAULT 0,
    
    -- Финансовые метрики
    total_revenue DECIMAL(15, 2) DEFAULT 0,
    average_price DECIMAL(15, 2) DEFAULT 0,
    
    -- Конкурентная аналитика
    market_share_percent DECIMAL(5, 2),
    competitors_count INTEGER,
    
    data JSONB,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица для истории контрактов и транзакций
CREATE TABLE contract_history (
    id SERIAL PRIMARY KEY,
    contract_id INTEGER REFERENCES contracts(id),
    user_id INTEGER REFERENCES users(id),
    
    action VARCHAR(50) NOT NULL,
    description TEXT,
    
    old_status VARCHAR(20),
    new_status VARCHAR(20),
    
    amount DECIMAL(15, 2),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для оптимизации
CREATE INDEX idx_contracts_seller ON contracts(seller_id);
CREATE INDEX idx_contracts_buyer ON contracts(buyer_id);
CREATE INDEX idx_contracts_status ON contracts(status);
CREATE INDEX idx_contracts_delivery_date ON contracts(delivery_date);
CREATE INDEX idx_contracts_category ON contracts(category);

CREATE INDEX idx_reviews_contract ON reviews(contract_id);
CREATE INDEX idx_reviews_reviewed_user ON reviews(reviewed_user_id);

CREATE INDEX idx_deliveries_contract ON deliveries(contract_id);
CREATE INDEX idx_deliveries_status ON deliveries(status);

CREATE INDEX idx_analytics_user ON market_analytics(user_id);
CREATE INDEX idx_analytics_period ON market_analytics(period_start, period_end);