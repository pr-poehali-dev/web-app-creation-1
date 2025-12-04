-- Update main admin login and password
-- Password: 123456 (bcrypt hash)
UPDATE users 
SET email = 'админ.ертп1', 
    password_hash = '$2b$12$8NJH.gjqYhZLq0v5X8QFZ.z2YhcBXlF7pzZ9KJvNXH8c0UQ3MO7Qy',
    failed_login_attempts = 0,
    locked_until = NULL
WHERE id = 7;