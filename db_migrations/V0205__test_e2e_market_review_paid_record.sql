-- Тестовая запись для сквозной проверки генерации ИИ-обзора (эмулирует состояние после успешной оплаты через webhook)
INSERT INTO t_p42562714_web_app_creation_1.market_review_purchases (user_id, ticker, amount, status, tbank_order_id)
VALUES (4, 'SBER', 1500, 'paid', 'test-e2e-check-sber')
ON CONFLICT DO NOTHING;