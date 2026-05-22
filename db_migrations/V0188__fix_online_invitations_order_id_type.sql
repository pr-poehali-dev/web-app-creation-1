ALTER TABLE online_invitations ALTER COLUMN order_id TYPE text USING order_id::text;
