# Настройка Telegram бота

## Шаг 1: Создание бота

1. Откройте Telegram и найдите **@BotFather**
2. Отправьте команду `/newbot`
3. Введите название бота (например: "ЕРТТП Уведомления")
4. Введите username бота (обязательно должен заканчиваться на "bot", например: "ErttpBot")
5. BotFather отправит вам токен

## Шаг 2: Добавление токена в проект

1. Скопируйте токен из BotFather
2. В poehali.dev добавьте секрет `TELEGRAM_BOT_TOKEN` с этим токеном
3. Токен выглядит так: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`

## Шаг 3: Настройка Webhook

После добавления токена в проект, выполните команду для настройки вебхука:

```bash
curl -X POST "https://api.telegram.org/bot<ВАШ_ТОКЕН>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://functions.poehali.dev/a0fb050f-4c4d-4081-887c-ebc6eb867030"}'
```

Или откройте в браузере:
```
https://api.telegram.org/bot<ВАШ_ТОКЕН>/setWebhook?url=https://functions.poehali.dev/a0fb050f-4c4d-4081-887c-ebc6eb867030
```

Замените `<ВАШ_ТОКЕН>` на реальный токен от BotFather.

## Шаг 4: Проверка настройки

Проверьте статус вебхука:
```
https://api.telegram.org/bot<ВАШ_ТОКЕН>/getWebhookInfo
```

Вы должны увидеть:
```json
{
  "ok": true,
  "result": {
    "url": "https://functions.poehali.dev/a0fb050f-4c4d-4081-887c-ebc6eb867030",
    "has_custom_certificate": false,
    "pending_update_count": 0
  }
}
```

## Шаг 5: Обновление имени бота в коде

В файле `src/components/profile/TelegramNotificationSettings.tsx` измените:

```typescript
const TELEGRAM_BOT_USERNAME = 'ErttpBot'; // Замените на username вашего бота
```

## Как работает бот

1. Пользователь нажимает кнопку "Открыть бота в Telegram" в профиле
2. Открывается Telegram с ссылкой вида: `https://t.me/ErttpBot?start=<USER_ID>`
3. Пользователь нажимает "Start" или отправляет `/start`
4. Бот отвечает с Chat ID пользователя
5. Пользователь копирует Chat ID и вставляет на сайте
6. Сайт сохраняет Chat ID в базу данных
7. При новых откликах система отправляет уведомления через Telegram

## Команды бота

- `/start` - Получить Chat ID и инструкции
- `/start <USER_ID>` - Получить Chat ID с привязкой к аккаунту
- `/help` - Справка по боту

## Проверка работы

1. Найдите вашего бота в Telegram по username
2. Отправьте `/start`
3. Бот должен ответить с вашим Chat ID
4. Скопируйте Chat ID
5. Вставьте в поле на сайте в профиле
6. Нажмите "Подключить"

Готово! Теперь вы будете получать уведомления в Telegram.

## Отладка

Если бот не отвечает:
1. Проверьте, что токен правильно добавлен в секреты
2. Проверьте статус вебхука командой `getWebhookInfo`
3. Проверьте логи функции `telegram-bot` в poehali.dev

## Функции проекта

- **telegram-bot** (`a0fb050f-4c4d-4081-887c-ebc6eb867030`) - Обработка сообщений от пользователей
- **telegram-notify** (`d49f8584-6ef9-47c0-9661-02560166e10f`) - Отправка уведомлений
- **telegram-connect** (`e57f42ad-e2c3-420c-a418-16a98422a47d`) - Управление подключениями
