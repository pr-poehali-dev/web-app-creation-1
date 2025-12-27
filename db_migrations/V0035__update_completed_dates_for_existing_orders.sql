-- Обновляем completed_date для существующих завершенных заказов
UPDATE t_p42562714_web_app_creation_1.orders 
SET completed_date = updated_at 
WHERE status = 'completed' AND completed_date IS NULL;