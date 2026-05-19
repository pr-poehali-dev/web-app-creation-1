ALTER TABLE t_p42562714_web_app_creation_1.orders
  ADD COLUMN IF NOT EXISTS pending_call jsonb NULL DEFAULT NULL;

COMMENT ON COLUMN t_p42562714_web_app_creation_1.orders.pending_call IS 'Данные активного входящего звонка: {callerId, callerName, roomId, type, calledAt}';
