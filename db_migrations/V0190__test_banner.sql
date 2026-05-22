INSERT INTO holiday_banners (title, message, type, start_date, end_date, is_active, background_color, text_color, icon, show_on_pages)
VALUES (
  'Тестовый баннер — ЕРТТП',
  'Добро пожаловать на Единую Региональную Товарно-Торговую Площадку! Здесь вы можете размещать предложения, запросы и участвовать в аукционах. Присоединяйтесь к развитию местного бизнеса Якутии!',
  'info',
  '2026-05-22',
  '2026-05-31',
  TRUE,
  '#166534',
  '#FFFFFF',
  '🎉',
  ARRAY['home', 'offers', 'requests', 'auctions']
);