CREATE TABLE IF NOT EXISTS game_tournaments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    game_type VARCHAR(16) NOT NULL,
    status VARCHAR(16) NOT NULL DEFAULT 'registration',
    min_players INTEGER NOT NULL DEFAULT 4,
    max_players INTEGER NOT NULL DEFAULT 16,
    entry_fee INTEGER NOT NULL DEFAULT 0,
    prize_pool INTEGER NOT NULL DEFAULT 0,
    starts_at TIMESTAMP,
    current_round INTEGER NOT NULL DEFAULT 0,
    winner_id INTEGER REFERENCES game_users(id),
    created_by INTEGER,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    finished_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS game_tournament_players (
    id SERIAL PRIMARY KEY,
    tournament_id INTEGER NOT NULL REFERENCES game_tournaments(id),
    user_id INTEGER NOT NULL REFERENCES game_users(id),
    fee_paid INTEGER NOT NULL DEFAULT 0,
    eliminated BOOLEAN NOT NULL DEFAULT FALSE,
    joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (tournament_id, user_id)
);

CREATE TABLE IF NOT EXISTS game_tournament_matches (
    id SERIAL PRIMARY KEY,
    tournament_id INTEGER NOT NULL REFERENCES game_tournaments(id),
    round INTEGER NOT NULL,
    match_index INTEGER NOT NULL,
    player1_id INTEGER REFERENCES game_users(id),
    player2_id INTEGER REFERENCES game_users(id),
    room_id INTEGER REFERENCES game_rooms(id),
    winner_id INTEGER REFERENCES game_users(id),
    status VARCHAR(16) NOT NULL DEFAULT 'playing',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_gt_status ON game_tournaments(status);
CREATE INDEX IF NOT EXISTS idx_gtp_tournament ON game_tournament_players(tournament_id);
CREATE INDEX IF NOT EXISTS idx_gtm_tournament ON game_tournament_matches(tournament_id);