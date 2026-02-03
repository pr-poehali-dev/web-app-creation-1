-- Нормализуем телефоны: 8XXXXXXXXXX → 7XXXXXXXXXX
UPDATE users 
SET phone = '7' || SUBSTRING(phone FROM 2)
WHERE phone LIKE '8%' AND LENGTH(phone) = 11;