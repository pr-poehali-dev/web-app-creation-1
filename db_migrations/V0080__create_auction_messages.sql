CREATE TABLE t_p42562714_web_app_creation_1.auction_messages (
    id SERIAL PRIMARY KEY,
    auction_id INTEGER NOT NULL,
    sender_id INTEGER NOT NULL,
    sender_name VARCHAR(255),
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_auction_messages_auction_id ON t_p42562714_web_app_creation_1.auction_messages(auction_id);
CREATE INDEX idx_auction_messages_sender_id ON t_p42562714_web_app_creation_1.auction_messages(sender_id);