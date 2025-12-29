-- Добавление колонки counter_offered_by для отслеживания кто сделал встречное предложение
ALTER TABLE t_p42562714_web_app_creation_1.orders 
ADD COLUMN IF NOT EXISTS counter_offered_by TEXT;