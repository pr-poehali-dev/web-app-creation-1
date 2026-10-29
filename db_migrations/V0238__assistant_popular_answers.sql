CREATE TABLE IF NOT EXISTS t_p42562714_web_app_creation_1.assistant_popular_answers (
    question_id VARCHAR(40) PRIMARY KEY,
    answer TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);