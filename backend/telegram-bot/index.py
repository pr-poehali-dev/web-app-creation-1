import json
import os

def handler(event: dict, context) -> dict:
    '''Telegram бот для получения Chat ID пользователей'''
    
    method = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    try:
        body = json.loads(event.get('body', '{}'))
        
        # Telegram отправляет обновления в формате:
        # {"update_id": 123, "message": {"message_id": 1, "from": {"id": 123456789, ...}, "chat": {...}, "text": "/start"}}
        
        if 'message' not in body:
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'ok': True}),
                'isBase64Encoded': False
            }
        
        message = body['message']
        chat_id = message['chat']['id']
        text = message.get('text', '')
        first_name = message.get('from', {}).get('first_name', 'Пользователь')
        
        bot_token = os.environ.get('TELEGRAM_BOT_TOKEN')
        frontend_url = os.environ.get('FRONTEND_URL', 'https://erttp.ru')
        
        if not bot_token:
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Bot token not configured'}),
                'isBase64Encoded': False
            }
        
        # Обрабатываем команды
        if text.startswith('/start'):
            # Извлекаем user_id из параметра start (если есть)
            user_id = None
            if ' ' in text:
                parts = text.split(' ')
                if len(parts) > 1:
                    user_id = parts[1]
            
            response_text = (
                f"👋 Привет, {first_name}!\n\n"
                f"🔢 Ваш Chat ID (нажмите, чтобы скопировать):\n"
                f"<b><code>{chat_id}</code></b>\n\n"
                f"<b>Два способа подключения:</b>\n\n"
                f"1️⃣ <b>Автоматически (рекомендуется):</b>\n"
                f"Нажмите кнопку ниже — Chat ID подставится автоматически!\n\n"
                f"2️⃣ <b>Вручную:</b>\n"
                f"Скопируйте число выше и вставьте в поле на сайте ЕРТТП.\n\n"
            )
            
            if user_id:
                response_text += (
                    f"✅ Обнаружена привязка к аккаунту #{user_id}\n"
                    f"После подключения вы будете получать уведомления об откликах!"
                )
            else:
                response_text += (
                    "💡 После перехода на сайт просто нажмите кнопку \"Подключить\"."
                )
            
            # Создаем inline кнопку для перехода на сайт с Chat ID в URL
            keyboard = {
                'inline_keyboard': [[
                    {'text': '🌐 Открыть профиль на сайте', 'url': f'{frontend_url}/profile?telegram_chat_id={chat_id}'}
                ]]
            }
            
            send_telegram_message(bot_token, chat_id, response_text, parse_mode='HTML', reply_markup=keyboard)
        
        elif text == '/help':
            response_text = (
                "ℹ️ Помощь по боту ЕРТТП\n\n"
                "Этот бот отправляет вам уведомления о новых откликах на ваши запросы и предложения.\n\n"
                "Команды:\n"
                "/start - Получить ваш Chat ID\n"
                "/help - Показать эту справку\n\n"
                f"Ваш Chat ID (нажмите, чтобы скопировать):\n<b><code>{chat_id}</code></b>\n"
            )
            
            keyboard = {
                'inline_keyboard': [[
                    {'text': '🌐 Открыть профиль на сайте', 'url': f'{frontend_url}/profile?telegram_chat_id={chat_id}'}
                ]]
            }
            
            send_telegram_message(bot_token, chat_id, response_text, parse_mode='HTML', reply_markup=keyboard)
        
        else:
            # Любое другое сообщение - отправляем Chat ID
            response_text = (
                f"🔢 Ваш Chat ID (нажмите, чтобы скопировать):\n"
                f"<b><code>{chat_id}</code></b>\n\n"
                "Используйте команду /start для получения инструкций."
            )
            
            keyboard = {
                'inline_keyboard': [[
                    {'text': '🌐 Открыть профиль на сайте', 'url': f'{frontend_url}/profile?telegram_chat_id={chat_id}'}
                ]]
            }
            
            send_telegram_message(bot_token, chat_id, response_text, parse_mode='HTML', reply_markup=keyboard)
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'ok': True}),
            'isBase64Encoded': False
        }
        
    except Exception as e:
        print(f'Error: {str(e)}')
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }


def send_telegram_message(bot_token: str, chat_id: int, text: str, parse_mode: str = 'Markdown', reply_markup: dict = None) -> bool:
    '''Отправка сообщения через Telegram Bot API'''
    import urllib.request
    
    url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
    
    data = {
        'chat_id': chat_id,
        'text': text,
        'parse_mode': parse_mode
    }
    
    if reply_markup:
        data['reply_markup'] = reply_markup
    
    try:
        req = urllib.request.Request(
            url,
            data=json.dumps(data).encode('utf-8'),
            headers={'Content-Type': 'application/json'},
            method='POST'
        )
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode('utf-8'))
            return result.get('ok', False)
    except Exception as e:
        print(f'Error sending Telegram message: {str(e)}')
        return False