-- Add admin_message column to user_verifications table for user messages during resubmission

ALTER TABLE user_verifications ADD COLUMN IF NOT EXISTS admin_message TEXT;

COMMENT ON COLUMN user_verifications.admin_message IS 'Message from user to admin during verification resubmission';
