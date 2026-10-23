INSERT INTO robot_rules (name, ticker, asset_name, kind, direction, entry_conditions, exit_conditions, stop_atr, target1_atr, target2_atr)
VALUES (
    'ВТБ: RSI и двойное дно',
    'VTBR',
    'Банк ВТБ',
    'share',
    'ЛОНГ',
    '[{"type":"rsi","op":"<","value":30},{"type":"double_bottom"}]',
    '[{"type":"rsi","op":">","value":70}]',
    1.5, 1.5, 3
);