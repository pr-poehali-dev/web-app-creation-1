CREATE TABLE IF NOT EXISTS t_p42562714_web_app_creation_1.mode_subscriptions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES t_p42562714_web_app_creation_1.users(id),
  mode_id VARCHAR(50) NOT NULL,
  plan VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  amount INTEGER NOT NULL,
  tbank_order_id VARCHAR(100),
  paid_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mode_subs_user_id ON t_p42562714_web_app_creation_1.mode_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_mode_subs_user_mode ON t_p42562714_web_app_creation_1.mode_subscriptions(user_id, mode_id);