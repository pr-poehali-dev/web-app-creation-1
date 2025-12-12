-- Архивируем все данные для чистого тестирования (меняем статусы)

-- Архивируем все предложения
UPDATE t_p42562714_web_app_creation_1.offers 
SET status = 'archived', updated_at = CURRENT_TIMESTAMP 
WHERE status != 'archived';

-- Архивируем все запросы
UPDATE t_p42562714_web_app_creation_1.requests 
SET status = 'archived' 
WHERE status != 'archived';

-- Архивируем все аукционы
UPDATE t_p42562714_web_app_creation_1.auctions 
SET status = 'archived', updated_at = CURRENT_TIMESTAMP 
WHERE status != 'archived';