ALTER TABLE users
  ADD COLUMN IF NOT EXISTS pin_hash character varying(255) NULL,
  ADD COLUMN IF NOT EXISTS pin_failed_attempts integer NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pin_locked_until timestamp without time zone NULL;