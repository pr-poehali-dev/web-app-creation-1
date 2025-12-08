-- Создание таблицы пользователей
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  phone VARCHAR(50),
  organization VARCHAR(255),
  inn VARCHAR(20),
  verification_status VARCHAR(20) DEFAULT 'not_verified',
  verification_documents TEXT[],
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы аукционов
CREATE TABLE IF NOT EXISTS auctions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,
  subcategory VARCHAR(100),
  quantity DECIMAL(10, 2),
  unit VARCHAR(50),
  starting_price DECIMAL(15, 2) NOT NULL,
  current_bid DECIMAL(15, 2) NOT NULL,
  min_bid_step DECIMAL(15, 2) NOT NULL,
  buy_now_price DECIMAL(15, 2),
  has_vat BOOLEAN DEFAULT false,
  vat_rate DECIMAL(5, 2),
  district VARCHAR(100) NOT NULL,
  full_address TEXT,
  gps_coordinates VARCHAR(100),
  available_districts TEXT[] NOT NULL,
  available_delivery_types TEXT[] NOT NULL,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  duration_days INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  is_premium BOOLEAN DEFAULT false,
  bid_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы изображений аукционов
CREATE TABLE IF NOT EXISTS auction_images (
  id SERIAL PRIMARY KEY,
  auction_id INTEGER NOT NULL,
  url TEXT NOT NULL,
  alt TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы ставок
CREATE TABLE IF NOT EXISTS bids (
  id SERIAL PRIMARY KEY,
  auction_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание индексов для оптимизации
CREATE INDEX IF NOT EXISTS idx_auctions_user_id ON auctions(user_id);
CREATE INDEX IF NOT EXISTS idx_auctions_status ON auctions(status);
CREATE INDEX IF NOT EXISTS idx_auctions_start_date ON auctions(start_date);
CREATE INDEX IF NOT EXISTS idx_auction_images_auction_id ON auction_images(auction_id);
CREATE INDEX IF NOT EXISTS idx_bids_auction_id ON bids(auction_id);
CREATE INDEX IF NOT EXISTS idx_bids_user_id ON bids(user_id);