-- Откатываем обратно телефон: 7XXXXXXXXXX → 8XXXXXXXXXX для тестового пользователя
UPDATE users 
SET phone = '89841017355'
WHERE phone = '79841017355' AND email = 'test@mail.ru';