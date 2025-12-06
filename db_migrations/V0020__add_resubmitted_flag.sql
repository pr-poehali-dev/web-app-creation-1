-- Add is_resubmitted flag to track resubmitted verification requests

ALTER TABLE user_verifications ADD COLUMN IF NOT EXISTS is_resubmitted BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN user_verifications.is_resubmitted IS 'Flag indicating if this verification was resubmitted after rejection';
