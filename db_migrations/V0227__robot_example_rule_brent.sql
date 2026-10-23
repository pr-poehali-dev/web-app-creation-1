INSERT INTO robot_rules (name, ticker, asset_name, kind, asset_code, direction, timeframe, entry_conditions, exit_conditions, stop_atr, target1_atr, target2_atr)
VALUES (
    'Brent: дивергенция + RSI + двойное дно 5 мин',
    'BR',
    'Нефть Brent',
    'future',
    'BR',
    'ОБА',
    60,
    '[{"type":"divergence_rsi","dir":"up"},{"type":"rsi","op":"<","value":35},{"type":"double_bottom","tf":5}]',
    '[{"type":"rsi","op":">","value":65}]',
    1.5, 1.5, 3
);