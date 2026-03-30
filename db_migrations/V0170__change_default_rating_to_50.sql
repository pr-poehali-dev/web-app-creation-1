-- Меняем DEFAULT рейтинг новых пользователей с 100 на 50
-- Существующие пользователи НЕ затрагиваются, только новые регистрации
ALTER TABLE t_p42562714_web_app_creation_1.users ALTER COLUMN rating SET DEFAULT 50.00;
