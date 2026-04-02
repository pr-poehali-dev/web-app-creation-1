-- Обновляем constraint статусов для таблицы offers: добавляем статус 'completed'
-- Это исправляет ошибку "check constraint violation" при завершении заказа,
-- когда код пытается установить status = 'completed' для offer

ALTER TABLE t_p42562714_web_app_creation_1.offers 
  DROP CONSTRAINT IF EXISTS offers_status_check;

ALTER TABLE t_p42562714_web_app_creation_1.offers 
  ADD CONSTRAINT offers_status_check 
  CHECK (status IN ('active', 'draft', 'pending', 'moderation', 'archived', 'completed'));