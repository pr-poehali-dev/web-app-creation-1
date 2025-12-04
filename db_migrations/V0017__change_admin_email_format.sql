-- Change admin email to proper email format
UPDATE users 
SET email = 'admin@ertp.ru',
    failed_login_attempts = 0,
    locked_until = NULL
WHERE id = 7;