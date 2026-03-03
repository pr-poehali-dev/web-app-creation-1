INSERT INTO t_p42562714_web_app_creation_1.site_settings (setting_key, setting_value, description)
VALUES (
  'vapid_private_key_pem',
  '-----BEGIN EC PRIVATE KEY-----
MHQCAQEEIAm1Fk+nTOMGQ88C+2FJEX9LqMsmsJO67T/ahqsdi5zOoAoGCCqGSM49
AwEHoUQDQgAEEA7IfZytaUB8IOvI8ev4BCxPf4iMPO5aKIy9Ab+7eOolFlAIX3wL
7JlavhYJ+/aSCVTMIpxx4CU6PdE+0D65Zg==
-----END EC PRIVATE KEY-----',
  'Приватный VAPID PEM ключ для Web Push уведомлений (EC P-256). Публичный ключ: BBAOyH2crWlAfCDryPHr-AQsT3-IjDzuWiiMvQG_u3jqJRZQCF98C-yZWr4WCfv2kglUzCKcceAlOj3RPtA-uWY'
)
ON CONFLICT DO NOTHING;