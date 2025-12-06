-- Изменение типа user_id с UUID на INTEGER в таблицах offers и requests
-- Таблицы пустые, данные не потеряются

-- Изменяем тип user_id в таблице offers
ALTER TABLE offers ALTER COLUMN user_id TYPE INTEGER USING NULL;

-- Изменяем тип user_id в таблице requests  
ALTER TABLE requests ALTER COLUMN user_id TYPE INTEGER USING NULL;