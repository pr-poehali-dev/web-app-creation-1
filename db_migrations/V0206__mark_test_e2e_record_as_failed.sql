UPDATE t_p42562714_web_app_creation_1.market_review_purchases
SET status = 'failed', updated_at = NOW()
WHERE tbank_order_id IN ('test-e2e-check-sber');