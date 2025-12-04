-- Change admin email to admin.ertp@mail.ru with password 123456
UPDATE users 
SET email = 'admin.ertp@mail.ru',
    password_hash = '$2a$12$K.QVhop/nBLVKLjsz1xXDO5Qd4YKJPh5AATK.z0aL2SoGXMXME7pK',
    failed_login_attempts = 0,
    locked_until = NULL,
    is_active = true
WHERE id = 7;