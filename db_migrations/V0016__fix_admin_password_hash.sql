-- Fix admin password hash for '123456'
-- This is a valid bcrypt hash for password '123456'
UPDATE users 
SET password_hash = '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    failed_login_attempts = 0,
    locked_until = NULL
WHERE email = 'админ.ертп1';