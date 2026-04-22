ALTER TABLE contract_responses
  ADD COLUMN IF NOT EXISTS negotiated_prepayment_percent NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS negotiated_contract_start_date DATE,
  ADD COLUMN IF NOT EXISTS negotiated_contract_end_date DATE;