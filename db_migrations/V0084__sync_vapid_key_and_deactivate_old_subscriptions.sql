UPDATE t_p42562714_web_app_creation_1.site_settings
SET setting_value = '-----BEGIN EC PRIVATE KEY-----
MHcCAQEEIJEUfaYbPVM9/Utzu+2jcAKB5aPHGqZpRAnbtv8QAEXUoAoGCCqGSM49
AwEHoUQDQgAEE8EKlN/p9tCtFyC3h/0XTF9uACZDV5Qw3/g4bFjugXoosvzTx+az
i6uKhuc2XUg4I+buBPWYz/d6T0biF2l0Gg==
-----END EC PRIVATE KEY-----
', updated_at = NOW()
WHERE setting_key = 'vapid_private_key_pem';

UPDATE t_p42562714_web_app_creation_1.push_subscriptions
SET active = false, updated_at = NOW()
WHERE active = true;