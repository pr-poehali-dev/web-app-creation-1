UPDATE users 
SET password_hash = '$2b$12$K1h9pN5Z.9v0W8YrE6xI0eKGHZJZvN3yGxPQx0oPqK3WvYxB7M6qK',
    failed_login_attempts = 0,
    locked_until = NULL
WHERE email = 'admin/ERTP';