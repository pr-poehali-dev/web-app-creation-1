'''
Telegram бот для подтверждения действий и уведомлений
Args: event - dict with httpMethod, body, queryStringParameters
      context - object with attributes: request_id, function_name
Returns: HTTP response dict with statusCode, headers, body
'''

import json
import os
import secrets
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
import psycopg2
from psycopg2.extras import RealDictCursor
import urllib.request

DATABASE_URL = os.environ.get('DATABASE_URL')
TELEGRAM_BOT_TOKEN = os.environ.get('TELEGRAM_BOT_TOKEN')
FRONTEND_URL = os.environ.get('FRONTEND_URL', 'https://preview--web-app-creation-1.poehali.dev')
DB_SCHEMA = os.environ.get('DB_SCHEMA', 'public')

def get_db_connection():
    return psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)

def send_telegram_message(bot_token: str, chat_id: int, text: str, parse_mode: str = 'HTML', reply_markup: dict = None) -> bool:
    """Отправка сообщения через Telegram Bot API"""
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

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    conn = get_db_connection()
    
    try:
        # Webhook от Telegram
        if method == 'POST' and event.get('body'):
            body = json.loads(event.get('body', '{}'))
            
            # Обработка обновлений от Telegram
            if 'message' in body:
                message = body['message']
                chat_id = message['chat']['id']
                text = message.get('text', '')
                user_telegram_id = message['from']['id']
                username = message['from'].get('username')
                first_name = message['from'].get('first_name', 'Пользователь')
                
                if not TELEGRAM_BOT_TOKEN:
                    return {
                        'statusCode': 500,
                        'headers': {'Content-Type': 'application/json'},
                        'body': json.dumps({'error': 'Bot token not configured'}),
                        'isBase64Encoded': False
                    }
                
                # Команда /start с параметром (привязка к аккаунту)
                if text.startswith('/start'):
                    parts = text.split()
                    if len(parts) > 1:
                        link_code = parts[1]
                        
                        with conn.cursor() as cur:
                            # Найти пользователя по коду привязки
                            cur.execute(
                                f"""SELECT user_id FROM {DB_SCHEMA}.telegram_link_codes 
                                   WHERE code = %s AND created_at > NOW() - INTERVAL '10 minutes'""",
                                (link_code,)
                            )
                            result = cur.fetchone()
                            
                            if result:
                                user_id = result['user_id']
                                
                                # Привязать Telegram к аккаунту
                                cur.execute(
                                    f"""UPDATE {DB_SCHEMA}.users 
                                       SET telegram_chat_id = %s, 
                                           telegram_username = %s,
                                           telegram_verified = TRUE 
                                       WHERE id = %s""",
                                    (str(chat_id), username, user_id)
                                )
                                
                                # Удалить использованный код
                                cur.execute(
                                    f"DELETE FROM {DB_SCHEMA}.telegram_link_codes WHERE code = %s",
                                    (link_code,)
                                )
                                
                                conn.commit()
                                
                                send_telegram_message(
                                    TELEGRAM_BOT_TOKEN,
                                    chat_id,
                                    f"✅ <b>Telegram успешно привязан!</b>\n\n"
                                    f"Теперь вы будете получать:\n"
                                    f"• Коды подтверждения для входа\n"
                                    f"• Ссылки для сброса пароля\n"
                                    f"• Важные уведомления\n\n"
                                    f"Можете закрыть эту вкладку и вернуться на сайт."
                                )
                            else:
                                send_telegram_message(
                                    TELEGRAM_BOT_TOKEN,
                                    chat_id,
                                    "❌ Неверный или устаревший код привязки.\n"
                                    "Запросите новый код на сайте."
                                )
                    else:
                        # Обычный /start без параметров
                        response_text = (
                            f"👋 Привет, {first_name}!\n\n"
                            f"🔢 Ваш Chat ID (нажмите, чтобы скопировать):\n"
                            f"<b><code>{chat_id}</code></b>\n\n"
                            f"Это бот для подтверждения действий на сайте Рынок Якутии.\n\n"
                            f"Чтобы привязать Telegram к вашему аккаунту:\n"
                            f"1. Зайдите в настройки профиля на сайте\n"
                            f"2. Нажмите 'Привязать Telegram'\n"
                            f"3. Перейдите по ссылке, которая откроет этот чат с кодом"
                        )
                        
                        keyboard = {
                            'inline_keyboard': [[
                                {'text': '🌐 Открыть сайт', 'url': FRONTEND_URL}
                            ]]
                        }
                        
                        send_telegram_message(
                            TELEGRAM_BOT_TOKEN,
                            chat_id,
                            response_text,
                            parse_mode='HTML',
                            reply_markup=keyboard
                        )
                
                # Команда /help
                elif text == '/help':
                    response_text = (
                        "ℹ️ <b>Помощь по боту</b>\n\n"
                        "Этот бот отправляет вам уведомления и коды подтверждения.\n\n"
                        "<b>Команды:</b>\n"
                        "/start - Получить Chat ID и инструкции\n"
                        "/help - Показать эту справку\n\n"
                        f"Ваш Chat ID: <code>{chat_id}</code>"
                    )
                    
                    keyboard = {
                        'inline_keyboard': [[
                            {'text': '🌐 Открыть сайт', 'url': FRONTEND_URL}
                        ]]
                    }
                    
                    send_telegram_message(
                        TELEGRAM_BOT_TOKEN,
                        chat_id,
                        response_text,
                        parse_mode='HTML',
                        reply_markup=keyboard
                    )
                
                else:
                    # Любое другое сообщение
                    response_text = (
                        f"🔢 Ваш Chat ID: <code>{chat_id}</code>\n\n"
                        "Используйте /start для получения инструкций."
                    )
                    
                    send_telegram_message(
                        TELEGRAM_BOT_TOKEN,
                        chat_id,
                        response_text,
                        parse_mode='HTML'
                    )
        
        # API эндпоинты для фронтенда
        if method == 'GET':
            query_params = event.get('queryStringParameters') or {}
            action = query_params.get('action')
            user_id = query_params.get('user_id')
            
            if action == 'generate_link_code' and user_id:
                # Генерация кода для привязки Telegram
                link_code = secrets.token_urlsafe(16)
                
                with conn.cursor() as cur:
                    # Очистить старые коды пользователя
                    cur.execute(
                        f"DELETE FROM {DB_SCHEMA}.telegram_link_codes WHERE user_id = %s",
                        (int(user_id),)
                    )
                    
                    # Создать новый код
                    cur.execute(
                        f"""INSERT INTO {DB_SCHEMA}.telegram_link_codes (user_id, code, created_at)
                           VALUES (%s, %s, NOW())""",
                        (int(user_id), link_code)
                    )
                    conn.commit()
                
                bot_username = os.environ.get('TELEGRAM_BOT_USERNAME', 'your_bot')
                telegram_link = f"https://t.me/{bot_username}?start={link_code}"
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({
                        'success': True,
                        'link': telegram_link,
                        'expires_in': 600
                    }),
                    'isBase64Encoded': False
                }
            
            elif action == 'check_status' and user_id:
                # Проверка статуса привязки Telegram
                with conn.cursor() as cur:
                    cur.execute(
                        f"""SELECT telegram_chat_id, telegram_username, telegram_verified 
                           FROM {DB_SCHEMA}.users WHERE id = %s""",
                        (int(user_id),)
                    )
                    result = cur.fetchone()
                    
                    if result:
                        return {
                            'statusCode': 200,
                            'headers': {
                                'Content-Type': 'application/json',
                                'Access-Control-Allow-Origin': '*'
                            },
                            'body': json.dumps({
                                'success': True,
                                'verified': result['telegram_verified'] or False,
                                'username': result['telegram_username']
                            }),
                            'isBase64Encoded': False
                        }
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'success': True, 'ok': True}),
            'isBase64Encoded': False
        }
        
    except Exception as e:
        print(f'Error: {str(e)}')
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'success': False, 'error': str(e)}),
            'isBase64Encoded': False
        }
    finally:
        conn.close()
