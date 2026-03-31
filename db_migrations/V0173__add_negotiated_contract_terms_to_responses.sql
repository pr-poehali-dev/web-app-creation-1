ALTER TABLE t_p42562714_web_app_creation_1.contract_responses
  ADD COLUMN IF NOT EXISTS negotiated_price_per_unit numeric(15,2) NULL,
  ADD COLUMN IF NOT EXISTS negotiated_delivery_date date NULL,
  ADD COLUMN IF NOT EXISTS negotiated_delivery_conditions text NULL,
  ADD COLUMN IF NOT EXISTS negotiated_special_terms text NULL,
  ADD COLUMN IF NOT EXISTS seller_wants_amend boolean NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS buyer_wants_amend boolean NULL DEFAULT false;
