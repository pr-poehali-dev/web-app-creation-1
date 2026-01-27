# Генерация VAPID ключей для Push-уведомлений

VAPID ключи необходимы для работы офлайн push-уведомлений через Web Push API.

## Способ 1: Онлайн генератор (самый простой)

1. Откройте: https://web-push-codelab.glitch.me/
2. Нажмите кнопку "Generate keys"
3. Скопируйте ключи:
   - **Public Key** → добавьте в секрет `VAPID_PUBLIC_KEY`
   - **Private Key** → добавьте в секрет `VAPID_PRIVATE_KEY`
   - **Email** → добавьте в формате `mailto:ваш@email.ru` в секрет `VAPID_EMAIL`

## Способ 2: Node.js (для разработчиков)

```bash
# Установите web-push
npm install -g web-push

# Сгенерируйте ключи
web-push generate-vapid-keys

# Результат:
# Public Key: BJwBXo8...
# Private Key: 0f8pT...
```

## Способ 3: Python (для разработчиков)

```bash
# Установите pywebpush
pip install pywebpush

# Запустите скрипт
python3 << EOF
from pywebpush import webpush, WebPushException
import json

vapid_claims = {"sub": "mailto:support@erttp.ru"}
print(json.dumps(vapid_claims))
EOF
```

Или используйте библиотеку py-vapid:
```bash
pip install py-vapid
vapid --gen
```

## Добавление ключей в проект

После генерации добавьте 3 секрета в админ-панели:

1. **VAPID_PUBLIC_KEY**: 
   - Пример: `BJwBXo8aef3h...длинная строка...`
   - Используется в браузере для подписки

2. **VAPID_PRIVATE_KEY**: 
   - Пример: `0f8pTdGx...длинная строка...`
   - Используется на сервере для отправки push

3. **VAPID_EMAIL**: 
   - Пример: `mailto:support@erttp.ru`
   - Контактный email администратора

## Обновление публичного ключа во фронтенде

После добавления секретов обновите файл `src/utils/pushNotifications.ts`:

```typescript
const VAPID_PUBLIC_KEY = 'BJwBXo8aef3h...'; // Вставьте ваш публичный ключ
```

## Проверка работы

1. Зайдите в профиль пользователя
2. Найдите карточку "Push-уведомления"
3. Нажмите "Включить"
4. Разрешите уведомления в браузере
5. Создайте тестовый заказ → продавец получит push даже если сайт закрыт!
