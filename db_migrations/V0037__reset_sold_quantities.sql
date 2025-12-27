-- Сброс проданного и зарезервированного количества в предложениях для тестирования
UPDATE offers 
SET sold_quantity = 0, reserved_quantity = 0 
WHERE sold_quantity > 0 OR reserved_quantity > 0;