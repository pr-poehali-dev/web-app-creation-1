UPDATE t_p42562714_web_app_creation_1.requests
SET 
  status = 'active',
  title = 'Пассажирские перевозки — Нюрба-Якутск',
  updated_at = NOW()
WHERE id IN (
  'edf793fc-1408-4583-8288-ec20864c5416',
  'cf045789-a060-4f7b-8c14-bd0f5bd70a38'
);