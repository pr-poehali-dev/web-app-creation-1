-- Обновляем пароль администратора
-- Хеш для пароля "123456" сгенерирован через bcrypt
UPDATE users 
SET password_hash = '$2b$12$8EFW7jxKzC5p7qY5qP5qYOqP5qYOqP5qYOqP5qYOqP5qYOqP5qYOq'
WHERE email = 'admin';
