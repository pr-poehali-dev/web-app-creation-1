-- Добавляем поля для торговли по цене и отслеживания остатков

-- Для заказов: встречная цена от продавца
ALTER TABLE orders ADD COLUMN IF NOT EXISTS counter_price_per_unit NUMERIC(10, 2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS counter_total_amount NUMERIC(10, 2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS counter_offer_message TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS counter_offered_at TIMESTAMP;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS buyer_accepted_counter BOOLEAN DEFAULT FALSE;

-- Для предложений: отслеживание проданного количества
ALTER TABLE offers ADD COLUMN IF NOT EXISTS sold_quantity INTEGER DEFAULT 0;
ALTER TABLE offers ADD COLUMN IF NOT EXISTS reserved_quantity INTEGER DEFAULT 0;

-- Комментарий для пояснения
COMMENT ON COLUMN orders.counter_price_per_unit IS 'Встречная цена за единицу от продавца';
COMMENT ON COLUMN orders.counter_total_amount IS 'Встречная общая сумма';
COMMENT ON COLUMN orders.counter_offer_message IS 'Сообщение продавца при встречном предложении';
COMMENT ON COLUMN orders.buyer_accepted_counter IS 'Покупатель принял встречное предложение';

COMMENT ON COLUMN offers.sold_quantity IS 'Количество проданного товара';
COMMENT ON COLUMN offers.reserved_quantity IS 'Количество зарезервированного товара (в обработке)';