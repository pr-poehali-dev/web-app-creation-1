UPDATE t_p42562714_web_app_creation_1.game_room_players p
SET side = 'black'
FROM t_p42562714_web_app_creation_1.game_rooms r
WHERE p.room_id = r.id
  AND r.status = 'waiting'
  AND r.game_type IN ('chess', 'checkers')
  AND p.side = 'white';