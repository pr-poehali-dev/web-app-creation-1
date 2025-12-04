UPDATE users 
SET role = 'admin',
    password_hash = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    failed_login_attempts = 0,
    locked_until = NULL
WHERE email = 'doydum-invest@mail.ru';