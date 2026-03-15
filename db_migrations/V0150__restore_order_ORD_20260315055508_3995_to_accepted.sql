UPDATE t_p42562714_web_app_creation_1.orders
SET status = 'accepted',
    completed_date = NULL,
    updated_at = CURRENT_TIMESTAMP
WHERE order_number = 'ORD-20260315055508-3995';