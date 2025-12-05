-- Таблица для изображений
CREATE TABLE IF NOT EXISTS offer_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  alt TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица для видео
CREATE TABLE IF NOT EXISTS offer_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  thumbnail TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица для продавцов
CREATE TABLE IF NOT EXISTS sellers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('individual', 'self-employed', 'entrepreneur', 'legal-entity')),
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  rating DECIMAL(2,1) DEFAULT 5.0,
  reviews_count INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT FALSE,
  responsible_person_name TEXT,
  responsible_person_phone TEXT,
  responsible_person_email TEXT,
  total_offers INTEGER DEFAULT 0,
  active_offers INTEGER DEFAULT 0,
  completed_orders INTEGER DEFAULT 0,
  registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица для предложений (offers)
CREATE TABLE IF NOT EXISTS offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  seller_id UUID,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT,
  quantity INTEGER NOT NULL,
  unit TEXT NOT NULL,
  price_per_unit DECIMAL(10,2) NOT NULL,
  has_vat BOOLEAN DEFAULT FALSE,
  vat_rate INTEGER,
  location TEXT,
  district TEXT NOT NULL,
  full_address TEXT,
  available_districts TEXT[] NOT NULL,
  video_id UUID,
  is_premium BOOLEAN DEFAULT FALSE,
  available_delivery_types TEXT[] NOT NULL,
  views_count INTEGER DEFAULT 0,
  ordered_quantity INTEGER DEFAULT 0,
  responses INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'draft', 'pending', 'moderation', 'archived')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expiry_date TIMESTAMP
);

-- Связующая таблица для изображений предложений
CREATE TABLE IF NOT EXISTS offer_image_relations (
  offer_id UUID NOT NULL,
  image_id UUID NOT NULL,
  sort_order INTEGER DEFAULT 0,
  PRIMARY KEY (offer_id, image_id)
);

-- Таблица для запросов (requests)
CREATE TABLE IF NOT EXISTS requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT,
  quantity INTEGER NOT NULL,
  unit TEXT NOT NULL,
  price_per_unit DECIMAL(10,2) NOT NULL,
  has_vat BOOLEAN DEFAULT FALSE,
  vat_rate INTEGER,
  district TEXT NOT NULL,
  delivery_address TEXT,
  available_districts TEXT[] NOT NULL,
  video_id UUID,
  is_premium BOOLEAN DEFAULT FALSE,
  views INTEGER DEFAULT 0,
  responses INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'draft', 'pending', 'closed', 'archived')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expiry_date TIMESTAMP
);

-- Связующая таблица для изображений запросов
CREATE TABLE IF NOT EXISTS request_image_relations (
  request_id UUID NOT NULL,
  image_id UUID NOT NULL,
  sort_order INTEGER DEFAULT 0,
  PRIMARY KEY (request_id, image_id)
);

-- Индексы для производительности
CREATE INDEX IF NOT EXISTS idx_offers_user_id ON offers(user_id);
CREATE INDEX IF NOT EXISTS idx_offers_category ON offers(category);
CREATE INDEX IF NOT EXISTS idx_offers_district ON offers(district);
CREATE INDEX IF NOT EXISTS idx_offers_status ON offers(status);
CREATE INDEX IF NOT EXISTS idx_offers_created_at ON offers(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_requests_user_id ON requests(user_id);
CREATE INDEX IF NOT EXISTS idx_requests_category ON requests(category);
CREATE INDEX IF NOT EXISTS idx_requests_district ON requests(district);
CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_created_at ON requests(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sellers_user_id ON sellers(user_id);