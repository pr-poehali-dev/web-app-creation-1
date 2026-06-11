CREATE TABLE IF NOT EXISTS t_p42562714_web_app_creation_1.support_tickets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    subject TEXT NOT NULL DEFAULT 'Обращение в поддержку',
    status TEXT NOT NULL DEFAULT 'open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS t_p42562714_web_app_creation_1.support_messages (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER NOT NULL,
    user_id INTEGER,
    is_admin BOOLEAN NOT NULL DEFAULT FALSE,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON t_p42562714_web_app_creation_1.support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON t_p42562714_web_app_creation_1.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_messages_ticket_id ON t_p42562714_web_app_creation_1.support_messages(ticket_id);