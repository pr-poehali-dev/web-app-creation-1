-- Игровой раздел: независимая система пользователей, комнат, ходов и чата
-- Никак не связана с основными таблицами users/offers и т.д.

CREATE TABLE game_users (
    id SERIAL PRIMARY KEY,
    nickname VARCHAR(32) UNIQUE NOT NULL,
    pin_hash VARCHAR(255) NOT NULL,
    webauthn_credential_id TEXT,
    webauthn_public_key TEXT,
    avatar_emoji VARCHAR(8) DEFAULT '🎮',
    chips_balance INTEGER NOT NULL DEFAULT 1000,
    games_played INTEGER NOT NULL DEFAULT 0,
    games_won INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP
);

CREATE TABLE game_rooms (
    id SERIAL PRIMARY KEY,
    game_type VARCHAR(16) NOT NULL,
    room_name VARCHAR(64),
    status VARCHAR(16) NOT NULL DEFAULT 'waiting',
    max_players INTEGER NOT NULL DEFAULT 2,
    created_by INTEGER NOT NULL REFERENCES game_users(id),
    state JSONB NOT NULL DEFAULT '{}'::jsonb,
    current_turn_user_id INTEGER REFERENCES game_users(id),
    winner_id INTEGER REFERENCES game_users(id),
    is_private BOOLEAN NOT NULL DEFAULT FALSE,
    invite_code VARCHAR(8),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE game_room_players (
    id SERIAL PRIMARY KEY,
    room_id INTEGER NOT NULL REFERENCES game_rooms(id),
    user_id INTEGER NOT NULL REFERENCES game_users(id),
    seat_index INTEGER NOT NULL DEFAULT 0,
    side VARCHAR(16),
    chips INTEGER,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(room_id, user_id)
);

CREATE TABLE game_moves (
    id SERIAL PRIMARY KEY,
    room_id INTEGER NOT NULL REFERENCES game_rooms(id),
    user_id INTEGER NOT NULL REFERENCES game_users(id),
    move_number INTEGER NOT NULL,
    move_data JSONB NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE game_chat_messages (
    id SERIAL PRIMARY KEY,
    room_id INTEGER NOT NULL REFERENCES game_rooms(id),
    user_id INTEGER NOT NULL REFERENCES game_users(id),
    message VARCHAR(500) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_game_rooms_status ON game_rooms(status);
CREATE INDEX idx_game_rooms_game_type ON game_rooms(game_type);
CREATE INDEX idx_game_room_players_room ON game_room_players(room_id);
CREATE INDEX idx_game_moves_room ON game_moves(room_id);
CREATE INDEX idx_game_chat_room ON game_chat_messages(room_id);
