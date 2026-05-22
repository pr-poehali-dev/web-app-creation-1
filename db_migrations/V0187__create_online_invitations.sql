
CREATE TABLE IF NOT EXISTS online_invitations (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL,
    sender_id INTEGER NOT NULL,
    recipient_id INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    responded_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '2 minutes')
);

CREATE INDEX IF NOT EXISTS idx_online_invitations_recipient ON online_invitations(recipient_id, status, expires_at);
CREATE INDEX IF NOT EXISTS idx_online_invitations_sender ON online_invitations(sender_id, status);
CREATE INDEX IF NOT EXISTS idx_online_invitations_order ON online_invitations(order_id);
