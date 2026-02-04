-- Разблокировка пользователя doydum-invest@mail.ru
UPDATE users 
SET locked_until = NULL, 
    failed_login_attempts = 0 
WHERE email = 'doydum-invest@mail.ru';