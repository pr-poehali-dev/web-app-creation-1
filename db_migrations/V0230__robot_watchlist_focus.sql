UPDATE t_p42562714_web_app_creation_1.robot_watchlist SET enabled = false WHERE ticker IN ('VTBR', 'ALRS');
INSERT INTO t_p42562714_web_app_creation_1.robot_watchlist (ticker, asset_name, kind, asset_code, enabled) VALUES
('GAZR', 'Газпром (фьючерс)', 'future', 'GAZR', true),
('ALRS_F', 'АЛРОСА (фьючерс)', 'future', 'ALRS', true)
ON CONFLICT (ticker) DO UPDATE SET enabled = true, kind = EXCLUDED.kind, asset_code = EXCLUDED.asset_code, asset_name = EXCLUDED.asset_name;