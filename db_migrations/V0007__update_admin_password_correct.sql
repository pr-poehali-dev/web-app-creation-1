-- Обновляем пароль администратора правильным хешем для "123456"
UPDATE users 
SET password_hash = '$2b$12$9sjViijusf.DteoDOzdoJeCSD3qTmcZyfD/Kr8wk5079rcx4iGzpe'
WHERE email = 'admin';
