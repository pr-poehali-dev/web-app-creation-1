-- Добавляем поля для периода поставки
ALTER TABLE offers ADD COLUMN delivery_period_start DATE;
ALTER TABLE offers ADD COLUMN delivery_period_end DATE;

COMMENT ON COLUMN offers.delivery_period_start IS 'Дата начала периода поставки';
COMMENT ON COLUMN offers.delivery_period_end IS 'Дата окончания периода поставки';