-- Таблица для управления текстовым контентом сайта
CREATE TABLE IF NOT EXISTS t_p42562714_web_app_creation_1.site_content (
    id SERIAL PRIMARY KEY,
    key VARCHAR(255) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    category VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица для праздничных баннеров и поздравлений
CREATE TABLE IF NOT EXISTS t_p42562714_web_app_creation_1.holiday_banners (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'banner',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    background_color VARCHAR(50) DEFAULT '#4F46E5',
    text_color VARCHAR(50) DEFAULT '#FFFFFF',
    icon VARCHAR(50),
    show_on_pages TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_site_content_key ON t_p42562714_web_app_creation_1.site_content(key);
CREATE INDEX IF NOT EXISTS idx_site_content_category ON t_p42562714_web_app_creation_1.site_content(category);
CREATE INDEX IF NOT EXISTS idx_holiday_banners_dates ON t_p42562714_web_app_creation_1.holiday_banners(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_holiday_banners_active ON t_p42562714_web_app_creation_1.holiday_banners(is_active);

-- Заполняем базовые тексты сайта
INSERT INTO t_p42562714_web_app_creation_1.site_content (key, value, description, category) VALUES
('home.hero.title', 'Единая региональная торгово-транспортная площадка', 'Главный заголовок на главной странице', 'home'),
('home.hero.subtitle', 'Маркетплейс для оптовых поставок строительных материалов и грузоперевозок', 'Подзаголовок на главной странице', 'home'),
('home.cta.button', 'Начать работу', 'Текст главной кнопки призыва к действию', 'home'),
('offers.empty.title', 'Предложений пока нет', 'Заголовок когда нет предложений', 'offers'),
('offers.empty.description', 'Станьте первым, кто разместит предложение', 'Описание когда нет предложений', 'offers')
ON CONFLICT (key) DO NOTHING;

-- Добавляем пример новогоднего баннера (будет активен 31 декабря - 10 января)
INSERT INTO t_p42562714_web_app_creation_1.holiday_banners (
    title, message, type, start_date, end_date, is_active, 
    background_color, text_color, icon, show_on_pages
) VALUES (
    '🎄 С Новым 2026 годом!',
    'Поздравляем с наступающим Новым годом! Желаем процветания вашему бизнесу и выгодных сделок в новом году!',
    'banner',
    '2025-12-31',
    '2026-01-10',
    true,
    '#DC2626',
    '#FFFFFF',
    'Sparkles',
    ARRAY['home', 'offers', 'requests']
) ON CONFLICT DO NOTHING;