-- Добавляем поле delivery_time для срока доставки
ALTER TABLE offers ADD COLUMN delivery_time VARCHAR(255);

COMMENT ON COLUMN offers.delivery_time IS 'Срок доставки/поставки (например: "1-2 дня", "3-5 рабочих дней", "В течение недели")';