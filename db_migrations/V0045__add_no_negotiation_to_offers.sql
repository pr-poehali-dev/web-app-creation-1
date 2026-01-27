-- Добавление поля no_negotiation в таблицу offers
ALTER TABLE t_p42562714_web_app_creation_1.offers 
ADD COLUMN IF NOT EXISTS no_negotiation BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN t_p42562714_web_app_creation_1.offers.no_negotiation IS 'Флаг "Без торга" - цена фиксирована';