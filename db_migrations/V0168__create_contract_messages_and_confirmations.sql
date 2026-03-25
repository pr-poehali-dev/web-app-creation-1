-- Таблица сообщений чата контракта
CREATE TABLE IF NOT EXISTS contract_messages (
    id SERIAL PRIMARY KEY,
    contract_id INTEGER NOT NULL REFERENCES contracts(id),
    response_id INTEGER REFERENCES contract_responses(id),
    sender_id INTEGER NOT NULL REFERENCES users(id),
    text TEXT,
    attachments JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_contract_messages_contract_id ON contract_messages(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_messages_response_id ON contract_messages(response_id);

-- Поля подтверждения контракта обеими сторонами
ALTER TABLE contract_responses 
    ADD COLUMN IF NOT EXISTS seller_confirmed BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS buyer_confirmed BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMP;
