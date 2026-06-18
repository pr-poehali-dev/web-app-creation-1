UPDATE t_p42562714_web_app_creation_1.mode_subscriptions
SET status = 'active',
    paid_at = NOW(),
    expires_at = NOW() + INTERVAL '7 days',
    updated_at = NOW()
WHERE tbank_order_id IN (
    'd036e86f-f82a-4156-a7f2-a23a28ac4e0d',
    '95071e37-9d55-4471-a741-a24d3a337eb8'
)
AND status = 'pending';