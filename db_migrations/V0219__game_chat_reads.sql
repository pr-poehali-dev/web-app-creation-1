CREATE TABLE IF NOT EXISTS game_chat_reads (
    room_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    last_read_id INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (room_id, user_id)
);