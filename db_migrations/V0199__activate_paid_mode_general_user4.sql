UPDATE t_p42562714_web_app_creation_1.mode_subscriptions
SET status = 'active',
    paid_at = NOW(),
    expires_at = NOW() + INTERVAL '7 days',
    updated_at = NOW()
WHERE tbank_order_id = '7c89c9dd-d89a-43d4-8b05-2e7a15d97098'
  AND status = 'pending';