CREATE TABLE IF NOT EXISTS t_p42562714_web_app_creation_1.order_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL,
    sender_id INTEGER NOT NULL,
    sender_type VARCHAR(10) NOT NULL CHECK (sender_type IN ('buyer', 'seller')),
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_order_messages_order_id ON t_p42562714_web_app_creation_1.order_messages(order_id);
CREATE INDEX IF NOT EXISTS idx_order_messages_sender_id ON t_p42562714_web_app_creation_1.order_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_order_messages_created_at ON t_p42562714_web_app_creation_1.order_messages(created_at DESC);