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
                f"🔢 Ваш Chat ID: `{chat_id}`\n\n"
                f"Скопируйте это число и вставьте в поле на сайте ЕРТТП для подключения уведомлений.\n\n"
            )
            
            if user_id:
                response_text += (
                    f"✅ Обнаружена привязка к аккаунту #{user_id}\n"
                    f"После подключения на сайте вы будете получать уведомления об откликах на ваши запросы и предложения!"
                )
            else:
                response_text += (
                    "💡 Чтобы автоматически привязать бота к вашему аккаунту, используйте кнопку 'Открыть бота в Telegram' в настройках профиля на сайте."
                )
            
            send_telegram_message(bot_token, chat_id, response_text)
        
        elif text == '/help':
            response_text = (
                "ℹ️ Помощь по боту ЕРТТП\n\n"
                "Этот бот отправляет вам уведомления о новых откликах на ваши запросы и предложения.\n\n"
                "Команды:\n"
                "/start - Получить ваш Chat ID\n"
                "/help - Показать эту справку\n\n"
                f"Ваш Chat ID: `{chat_id}`"
            )
            send_telegram_message(bot_token, chat_id, response_text)
        
        else:
            # Любое другое сообщение - отправляем Chat ID
            response_text = (
                f"🔢 Ваш Chat ID: `{chat_id}`\n\n"
                "Используйте команду /start для получения инструкций."
            )
            send_telegram_message(bot_token, chat_id, response_text)
        
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


def send_telegram_message(bot_token: str, chat_id: int, text: str) -> bool:
    '''Отправка сообщения через Telegram Bot API'''
    import urllib.request
    import urllib.parse
    
    url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
    
    data = {
        'chat_id': chat_id,
        'text': text,
        'parse_mode': 'Markdown'
    }
    
    try:
        req_data = urllib.parse.urlencode(data).encode('utf-8')
        req = urllib.request.Request(url, data=req_data, method='POST')
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode('utf-8'))
            return result.get('ok', False)
    except Exception as e:
        print(f'Error sending Telegram message: {str(e)}')
        return False
