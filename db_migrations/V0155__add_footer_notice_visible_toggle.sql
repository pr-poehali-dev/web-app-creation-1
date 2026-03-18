INSERT INTO t_p42562714_web_app_creation_1.site_content (key, value, description, category)
VALUES
  ('footer.notice.visible', 'true', 'Показывать блок «Внимание!» в подвале сайта (true/false)', 'footer')
ON CONFLICT (key) DO NOTHING;
