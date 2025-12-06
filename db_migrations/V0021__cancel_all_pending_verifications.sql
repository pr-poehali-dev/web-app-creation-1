-- Set all pending and rejected verifications back to rejected status with cancellation message
UPDATE user_verifications 
SET status = 'rejected',
    rejection_reason = 'Заявка отменена администратором. Подайте новую заявку.',
    is_resubmitted = FALSE,
    updated_at = CURRENT_TIMESTAMP
WHERE status IN ('pending', 'rejected');

-- Reset verification status for users who had pending or rejected verifications
UPDATE users 
SET verification_status = 'not_verified' 
WHERE verification_status IN ('pending', 'rejected');