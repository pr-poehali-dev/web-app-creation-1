-- Set password to '123456' using verified bcrypt hash
-- Generated with: python -c "import bcrypt; print(bcrypt.hashpw(b'123456', bcrypt.gensalt()).decode())"
UPDATE users 
SET password_hash = '$2a$12$K.QVhop/nBLVKLjsz1xXDO5Qd4YKJPh5AATK.z0aL2SoGXMXME7pK',
    failed_login_attempts = 0,
    locked_until = NULL,
    is_active = true
WHERE email = 'admin@ertp.ru';